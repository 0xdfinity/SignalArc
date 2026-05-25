# Contributing

SignalArc is organized as an Arc starter kit. Contributions should make the primitives easier to reuse or the product safer to operate.

## Local Workflow

```bash
npm install
cp .env.example .env
npm run arc:check
npm run lint
npm run contracts:test
```

Run `npm run build` before opening a production-facing change.

## Contribution Areas

- New Arc venue adapters
- Policy rule extensions
- Receipt and verdict scoring
- External agent connectors
- Security hardening
- Documentation that helps builders fork the primitives faster

## Standards

- Keep API contracts typed and validated with Zod.
- Keep public UI copy focused on user outcomes.
- Keep secrets out of logs, client payloads, and examples.
- Keep contract changes covered by Hardhat tests.
- Keep database changes in Supabase migrations.
