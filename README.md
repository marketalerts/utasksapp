<h1 align="center">
  <img alt="utasksfront" src="./QRLogo.svg" />
</h1>

A monorepo for all utasks front-end apps and packages.

At the moment, it contains:
- The main telegram-mini-app - [utf](#utf)
- [UI components library](packages/ui)
- [Icons library](packages/icons)
- [UI theme library](packages/theme)
- [UI system docs](#docs)
- [Custom eslint config](packages/eslint-config/)
- [Custom tsconfig](packages/tsconfig/)
- [Custom data mapper](packages/data-mapper/) - to be split into a separate package
- [Vite plugin for dynamic JSON imports](packages/vite-plugin-dynamic-import-json/) - to be split into a separate package
- [Localization engine](https://github.com/Raiondesu/intl-schematic/) - already split into a separate package

## [UTF](apps/utf/)
> UTasksFront app

https://app.utasks.io/utf

[![🟢 pr-test](actions/workflows/pr-test.yaml/badge.svg)](actions/workflows/pr-test.yaml)
[![🔵 pr-prod](actions/workflows/pr-prod.yaml/badge.svg)](actions/workflows/pr-prod.yaml)

### Deploy

- 🔴 [Dev](): same as Sandbox, but mostly used for local testing on backend.
- 🟡 [Sandbox](): simply push to the [`dev` branch](/tree/dev).
- 🟢 [Test](): create a Pull Request from `dev` to `main`.
- 🔵 [Production](https://t.me/UTasksBot): merge said Pull Request.

### Local project start

Copy `.env.local.example`, rename the new file to `.env.dev.local`.

```bash
npm i -ws

npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Update locales and api schema

`npm run update-api -w utf` - to update the api schema
`npm run update-locales -w utf` - to update locales

Carefully review before committing!

---

## Why ?

This monorepo is a part of a long-term transitioning plan to separate all internal packages and projects into separate repositories.\
Since the project is still in early development stages, full decoupling would prove difficult and cumbersome - proper concern boundaries are not set yet, and the code that is split into separate repositories could quickly become tightly-coupled.\
Keeping the packages in a single repo allows initial tight coupling, while maintaing mental barriers between different concerns in the code.
