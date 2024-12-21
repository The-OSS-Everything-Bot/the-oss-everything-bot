# Code Standards

Look, we need to keep this codebase clean. Here's what you gotta do:

## Formatting

- Run prettier before you commit. Just do it.
- Use the `.prettierrc` config we already have
- 2 spaces for indentation, no tabs
- No trailing whitespace
- Keep it consistent with what's already there

## Testing

Your code needs to actually work. Test it locally before making a PR.

The CI will run these checks:
- ESLint
- Prettier format check 
- Compilation test
- Typo check

If these fail, your PR gets rejected. Simple as that.

## Performance

- Don't write slow code
- Cache stuff that gets used often
- Use constants for hardcoded values
- Keep database queries efficient
- Don't do unnecessary API calls

## Database

- Follow the schema structure in dbManager.js
- Use prepared statements
- Cache frequently accessed data in Redis
- Add proper indexes for queries

## Commands

- Look at existing commands for structure
- Include both slash and prefix command handlers
- Add proper permission checks
- Handle errors gracefully
- Log important events

## Error Handling

- Catch errors properly
- Log them with console.error()
- Give useful error messages to users
- Don't expose sensitive info in errors

That's it. Format your code, test it works, make it fast. Not complicated.
