# Contributing

So you want to contribute? Cool. Here's how:

1. Fork the repo
2. Make a branch
3. Write your code
4. Test it works
5. Make a PR

## Development Setup

1. Clone your fork
2. `npm install`
3. Copy `.env.example` to `.env` and fill in values
4. `npm run dev` to start the bot

## CI Setup (Required Before PR)

You MUST set up the CI before making a PR or it'll fail:

1. Go to Settings > Secrets and Variables > Actions
2. Create a new secret called `BOT_TOKEN`
3. Add a Discord bot token (use a test bot, not prod)

The CI needs this to run the test suite. PRs with failing CI will be auto-rejected.

## Before Making a PR

- Make sure your code actually works
- Run prettier (`npm run format`)
- Test all the commands you modified
- Update any relevant docs

## PR Guidelines

Keep PRs focused on one thing. Don't try to fix 10 different things in one PR.

Include:
- What you changed
- Why you changed it
- How you tested it

## Code Style

Look at the existing code and copy that style. Check CODE.md for specifics.

The bot uses:
- JavaScript/TypeScript
- Discord.js
- LibSQL/Redis
- Express

## Getting Help

- Look at the codebase
- Join the Discord if you're really stuck

That's basically it. Write good code, test it works, follow the style. We'll review it when we can.
