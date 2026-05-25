#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");
const historyMode = args.has("--history");
const allRefs = args.has("--all");

const SKIP_EXTENSIONS = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".lock",
  ".png",
  ".svg",
  ".webp",
]);

const SKIP_PATHS = [
  /^node_modules\//,
  /^\.git\//,
  /^\.next\//,
  /^artifacts\//,
  /^cache\//,
  /^coverage\//,
];

const PLACEHOLDER = /(<[^>\r\n]+>|your[-_a-z0-9]*|change[-_]?me|placeholder|example|sample|dummy|not-a-secret|replace[-_ ]?me|local|localhost|test[-_ ]?only)/i;

const RULES = [
  {
    name: "private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/i,
  },
  {
    name: "OpenAI-style secret key",
    pattern: /sk-[A-Za-z0-9_-]{8,}/,
  },
  {
    name: "Anthropic API key",
    pattern: /sk-ant-[A-Za-z0-9_-]{20,}/,
  },
  {
    name: "GitHub token",
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}/,
  },
  {
    name: "Google API key",
    pattern: /AIza[0-9A-Za-z_-]{20,}/,
  },
  {
    name: "Slack token",
    pattern: /xox[baprs]-[0-9A-Za-z-]{20,}/,
  },
  {
    name: "JWT",
    pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  },
  {
    name: "AWS access key",
    pattern: /AKIA[0-9A-Z]{16}/,
  },
  {
    name: "sensitive env assignment",
    pattern: /^\s*(?:export\s+)?[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)[A-Z0-9_]*\s*=\s*["']?([^"'\s#]+)["']?/i,
    valueGroup: 1,
  },
];

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function listFiles() {
  if (stagedOnly) {
    return git(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"])
      .split(/\r?\n/)
      .filter(Boolean);
  }

  return git(["ls-files"]).split(/\r?\n/).filter(Boolean);
}

function shouldSkip(file) {
  return SKIP_EXTENSIONS.has(extname(file).toLowerCase()) || SKIP_PATHS.some((pattern) => pattern.test(file));
}

function readFile(file) {
  if (stagedOnly) {
    try {
      return git(["show", `:${file}`]);
    } catch {
      return "";
    }
  }

  return readFileSync(file, "utf8");
}

function scanContent(file, content, prefix = "") {
  const hits = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (PLACEHOLDER.test(line)) {
      return;
    }

    for (const rule of RULES) {
      const match = line.match(rule.pattern);
      if (!match) {
        continue;
      }

      const value = rule.valueGroup ? match[rule.valueGroup] : match[0];
      if (value && !PLACEHOLDER.test(value)) {
        hits.push(`${prefix}${file}:${index + 1} ${rule.name}`);
      }
    }
  });

  return hits;
}

function scanFiles() {
  const hits = [];

  for (const file of listFiles()) {
    if (shouldSkip(file)) {
      continue;
    }

    hits.push(...scanContent(file, readFile(file)));
  }

  return hits;
}

function scanHistory() {
  const commits = git(["rev-list", allRefs ? "--all" : "HEAD"]).split(/\r?\n/).filter(Boolean);
  const hits = [];

  for (const commit of commits) {
    const files = git(["ls-tree", "-r", "--name-only", commit]).split(/\r?\n/).filter(Boolean);

    for (const file of files) {
      if (shouldSkip(file)) {
        continue;
      }

      const content = git(["show", `${commit}:${file}`]);
      hits.push(...scanContent(file, content, `${commit.slice(0, 12)} `));
    }
  }

  return hits;
}

const hits = historyMode ? scanHistory() : scanFiles();

if (hits.length > 0) {
  console.error("Secret scan failed. Remove or replace these values before committing:");
  for (const hit of hits) {
    console.error(`- ${hit}`);
  }
  process.exit(1);
}

console.log(historyMode ? "Secret history scan passed." : "Secret scan passed.");
