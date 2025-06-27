# Release Orchestrator Chat Mode

The Release Orchestrator now supports a chat-based interaction mode designed to work with GitHub Copilot Chat or other AI-assisted development tools.

## Using Chat Mode

To run the release orchestrator in chat mode, use one of the following commands:

```bash
# Standard release with chat interface
yarn release:chat

# Release with safety mode (triple confirmation) and chat interface
yarn release:safe:chat
```

## How Chat Mode Works

When chat mode is enabled, the release orchestrator will:

1. Format prompts in a way that's more readable in chat interfaces
2. Provide clear indicators when user input is expected
3. Format choices and options in a more structured way
4. Add additional context to help understand the release process

## Integration with GitHub Copilot Chat

The chat mode is designed to be used with GitHub Copilot Chat. When using it:

1. Start the release process with `yarn release:chat`
2. Interact with the prompts directly in the GitHub Copilot Chat interface
3. The orchestrator will provide clear formatting to distinguish prompts from other output
4. All critical operations will be clearly marked

## For Developers

If you're extending the release orchestrator, keep in mind:

- Use `this.config.chatMode` to check if chat mode is enabled
- For user input, use the chat-specific methods when in chat mode:
  - `chatPrompt()` instead of `prompt()`
  - `chatPromptYesNo()` instead of `promptYesNo()`
  - `chatPromptChoice()` instead of `promptChoice()`
- Format output with clear visual separation to make it easy to follow in a chat interface
