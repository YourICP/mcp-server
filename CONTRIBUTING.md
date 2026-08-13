# Contributing to YourICP MCP Server

Thanks for your interest in contributing! 🎉

## Getting started

1. Fork and clone the repository.
2. Install dependencies: `npm install`.
3. Create a branch: `git checkout -b my-feature`.
4. Make your changes and add tests where it makes sense.
5. Run the test suite: `npm test`.
6. Commit with a clear message and open a pull request.

## Guidelines

- Keep the server dependency-light and easy to run locally.
- Never commit secrets, API tokens, or `.env` files.
- Match the existing code style (ES modules, small focused functions).
- For new tools, document them in the README tool table and include a short description.

## Reporting bugs

Open an issue with steps to reproduce, expected vs. actual behavior, and your
Node.js version. For security-sensitive reports, see [SECURITY.md](SECURITY.md)
instead of filing a public issue.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By
participating, you agree to uphold it.
