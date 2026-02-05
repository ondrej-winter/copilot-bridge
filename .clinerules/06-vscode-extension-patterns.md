# VS Code Extension patterns: lifecycle, commands, configuration, Language Model API

Use these patterns when building VS Code extensions to follow best practices and conventions.

## Extension lifecycle
- **Must** implement `activate(context: vscode.ExtensionContext)` as the entry point.
- **Should** implement `deactivate()` for cleanup (close servers, dispose resources).
- **Must** register all disposables in `context.subscriptions` to ensure proper cleanup.
- **Should** use `vscode.Disposable` for resources that need cleanup.
- **Must** handle activation errors gracefully and log them appropriately.

### Example lifecycle
```typescript
export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('My Extension');
  
  const command = vscode.commands.registerCommand('myExt.doSomething', async () => {
    // Command logic
  });
  
  context.subscriptions.push(command, outputChannel);
}

export function deactivate() {
  // Cleanup logic (close servers, dispose resources)
}
```

## Command registration
- **Must** register commands in the `activate()` function.
- **Must** declare all commands in `package.json` under `contributes.commands`.
- **Should** use namespaced command IDs (e.g., `extensionName.commandName`).
- **Must** handle command errors and show user-friendly messages.
- **Should** use async functions for commands that perform I/O.

### Command pattern
```typescript
const startCommand = vscode.commands.registerCommand('myExt.start', async () => {
  try {
    await startService();
    vscode.window.showInformationMessage('Service started');
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to start: ${err.message}`);
  }
});

context.subscriptions.push(startCommand);
```

## Configuration management
- **Must** declare all configuration options in `package.json` under `contributes.configuration`.
- **Must** use `vscode.workspace.getConfiguration('extensionName')` to read settings.
- **Should** provide sensible defaults for all configuration values.
- **Should** validate configuration values at runtime.
- **Must** document configuration options with clear descriptions.

### Configuration pattern
```typescript
interface ExtensionConfig {
  port: number;
  token: string;
  maxRetries: number;
}

function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('myExtension');
  return {
    port: config.get<number>('port', 3000),
    token: config.get<string>('token', ''),
    maxRetries: config.get<number>('maxRetries', 3)
  };
}
```

## Output channels and logging
- **Must** create output channels for extension-specific logging.
- **Should** use `outputChannel.show()` to display logs when relevant.
- **Must** log errors, warnings, and important operations.
- **Should** include timestamps or request IDs for traceability.

### Logging pattern
```typescript
const outputChannel = vscode.window.createOutputChannel('My Extension');

outputChannel.appendLine(`[${new Date().toISOString()}] Service started`);
outputChannel.appendLine(`[Error] Failed to connect: ${error.message}`);

// Show output panel when relevant
outputChannel.show(true); // true = preserveFocus
```

## Language Model API (VS Code LM)
- **Must** check model availability before using Language Model API.
- **Should** cache model selections when appropriate for performance.
- **Must** handle consent dialogs (first-time model usage triggers user consent).
- **Should** provide fallback behavior when models are unavailable.
- **Must** use `CancellationToken` for long-running model operations.

### Model selection pattern
```typescript
async function selectModel(family?: string): Promise<vscode.LanguageModelChat> {
  const models = await vscode.lm.selectChatModels({
    vendor: 'copilot',
    family: family
  });
  
  if (models.length === 0) {
    throw new Error('No Copilot models available');
  }
  
  return models[0];
}

async function sendChatRequest(
  messages: vscode.LanguageModelChatMessage[],
  token: vscode.CancellationToken
): Promise<string> {
  const model = await selectModel();
  const request = await model.sendRequest(messages, {}, token);
  
  let response = '';
  for await (const fragment of request.text) {
    response += fragment;
  }
  
  return response;
}
```

## User notifications
- **Must** use appropriate notification levels:
  - `showInformationMessage()`: Success or informational updates
  - `showWarningMessage()`: Recoverable issues
  - `showErrorMessage()`: Failures or critical errors
- **Should** keep messages concise and actionable.
- **Should** provide action buttons when user can resolve the issue.
- **Must** avoid notification spam; batch or debounce when appropriate.

### Notification pattern
```typescript
// Success notification
vscode.window.showInformationMessage('Server started on port 3000');

// Error with action button
const action = await vscode.window.showErrorMessage(
  'Failed to start server',
  'Retry',
  'View Logs'
);

if (action === 'Retry') {
  await startServer();
} else if (action === 'View Logs') {
  outputChannel.show();
}
```

## Activation events
- **Must** declare activation events in `package.json` under `activationEvents`.
- **Should** use specific activation events rather than `*` (activates on startup).
- Common activation events:
  - `onCommand:extensionName.commandName` - When command is invoked
  - `onLanguage:typescript` - When specific language file is opened
  - `onStartupFinished` - After VS Code startup completes
  - `onUri` - When extension URI is opened

### Activation events example
```json
{
  "activationEvents": [
    "onCommand:myExtension.start",
    "onStartupFinished"
  ]
}
```

## Extension context and state
- **Must** use `context.globalState` for global persistent storage.
- **Must** use `context.workspaceState` for workspace-specific storage.
- **Must** handle storage errors gracefully.

### State management pattern
```typescript
// Store global state
await context.globalState.update('lastUsedPort', 3000);

// Retrieve global state
const port = context.globalState.get<number>('lastUsedPort', 3000);
```

## Extension testing
- **Should** use `@vscode/test-electron` for integration tests.
- **Must** mock VS Code APIs in unit tests.
- **Should** test extension activation and deactivation.
- **Should** test command registration and execution.
- See `03-testing-standards.md` for detailed testing guidelines.

## Hexagonal architecture integration
- **Should** keep VS Code API interactions in output adapters.
- **Must** define ports for configuration, logging, and Language Model operations.
- **Should** wire dependencies in `activate()` function (entry point).
- See `02-architecture-guardrails.md` for architectural patterns.

### Adapter pattern for VS Code APIs
```typescript
// Port (application layer)
interface LanguageModelPort {
  sendRequest(messages: ChatMessage[]): Promise<string>;
}

// Adapter (infrastructure layer)
class VSCodeLanguageModelAdapter implements LanguageModelPort {
  async sendRequest(messages: ChatMessage[]): Promise<string> {
    const vscodeMessages = messages.map(m => 
      vscode.LanguageModelChatMessage.User(m.content)
    );
    
    const model = await vscode.lm.selectChatModels({ vendor: 'copilot' })[0];
    const request = await model.sendRequest(vscodeMessages, {}, token);
    
    // Buffer response
    let response = '';
    for await (const fragment of request.text) {
      response += fragment;
    }
    
    return response;
  }
}
```
