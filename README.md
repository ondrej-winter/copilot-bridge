# Copilot Bridge

VS Code extension that exposes GitHub Copilot Chat via a local HTTP endpoint. Designed as a bridge for external tools (e.g., Python apps) to send chat messages through the VS Code Language Model API.

## Features

- = **Secure**: Only accepts requests from localhost (127.0.0.1/::1)
- = **Optional Authentication**: Bearer token support for additional security
- =€ **Simple HTTP API**: Single POST endpoint for chat requests
- =æ **Buffered Responses**: Non-streaming responses (buffers internally and returns complete text)
- <¯ **Model Selection**: Supports different Copilot model families with fallback
- =à **Tool-Calling Ready**: Designed to support future tool-calling features

## Requirements

- VS Code 1.85.0 or higher
- GitHub Copilot extension installed and authenticated
- Active GitHub Copilot subscription

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile TypeScript:
   ```bash
   npm run compile
   ```
4. Press F5 in VS Code to run the extension in development mode, or:
5. Package and install:
   ```bash
   npx vsce package
   code --install-extension copilot-bridge-0.1.0.vsix
   ```

## Usage

### Starting the Bridge

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run: **Copilot Bridge: Start**
3. The extension will:
   - Warm up model selection (may trigger consent dialog)
   - Start HTTP server on configured port (default: 32123)
   - Show notification with server URL

### Stopping the Bridge

1. Open Command Palette
2. Run: **Copilot Bridge: Stop**

## Configuration

Configure in VS Code settings (`Cmd+,` / `Ctrl+,`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `copilotBridge.port` | number | 32123 | Port number for HTTP server |
| `copilotBridge.bindAddress` | string | "127.0.0.1" | Bind address (always enforced to localhost) |
| `copilotBridge.token` | string | "" | Optional bearer token (empty = no auth) |
| `copilotBridge.defaultFamily` | string | "gpt-4o" | Default model family ("gpt-4o", "gpt-3.5-turbo", or "auto") |
| `copilotBridge.maxBodyBytes` | number | 1000000 | Maximum request body size in bytes |

### Example settings.json

```json
{
  "copilotBridge.port": 32123,
  "copilotBridge.token": "my-secret-token",
  "copilotBridge.defaultFamily": "gpt-4o",
  "copilotBridge.maxBodyBytes": 2000000
}
```

## API Reference

### POST /v1/chat

Send chat messages to Copilot and receive a buffered response.

#### Request

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is TypeScript?"
    }
  ],
  "model": {
    "family": "gpt-4o"
  }
}
```

**Fields:**
- `messages` (required): Array of message objects
  - `role`: "system", "user", or "assistant"
  - `content`: Message text
- `model` (optional): Model selection
  - `family`: Model family name (e.g., "gpt-4o", "gpt-3.5-turbo")

**Notes:**
- System messages are prepended to the first user message with a clear separator
- At least one message is required
- Messages support multi-turn conversations with assistant responses

#### Response (200 OK)

```json
{
  "id": "req_550e8400-e29b-41d4-a716-446655440000",
  "model": {
    "vendor": "copilot",
    "family": "gpt-4o"
  },
  "output_text": "TypeScript is a strongly typed programming language...",
  "meta": {
    "startedAt": "2026-02-05T19:10:00.000Z",
    "endedAt": "2026-02-05T19:10:05.123Z"
  }
}
```

#### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid JSON, missing messages, or body too large |
| 401 | Unauthorized | Missing or invalid bearer token |
| 403 | Forbidden | Request not from localhost |
| 404 | Not Found | Unknown endpoint |
| 500 | Internal Server Error | Server or model error |

**Error Format:**
```json
{
  "error": "Bad Request",
  "details": "messages array is required and must not be empty"
}
```

## Examples

### cURL Example

```bash
# Simple request (no auth)
curl -X POST http://127.0.0.1:32123/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is VS Code?"}
    ]
  }'

# With system message and specific model
curl -X POST http://127.0.0.1:32123/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a concise technical expert."},
      {"role": "user", "content": "Explain TypeScript in one sentence."}
    ],
    "model": {"family": "gpt-4o"}
  }'

# With bearer token authentication
curl -X POST http://127.0.0.1:32123/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-token" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### Python Example

```python
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:32123"
BEARER_TOKEN = ""  # Set if configured in VS Code settings

def chat_with_copilot(messages, model_family=None):
    """
    Send chat request to Copilot Bridge.

    Args:
        messages: List of message dicts with 'role' and 'content'
        model_family: Optional model family (e.g., 'gpt-4o')

    Returns:
        Response dict with output_text and metadata
    """
    url = f"{BASE_URL}/v1/chat"

    payload = {"messages": messages}
    if model_family:
        payload["model"] = {"family": model_family}

    headers = {"Content-Type": "application/json"}
    if BEARER_TOKEN:
        headers["Authorization"] = f"Bearer {BEARER_TOKEN}"

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    return response.json()


# Example 1: Simple question
def example_simple():
    messages = [
        {"role": "user", "content": "What is TypeScript?"}
    ]

    result = chat_with_copilot(messages)
    print(f"Response: {result['output_text']}")
    print(f"Model: {result['model']['vendor']}/{result['model']['family']}")


# Example 2: With system message
def example_with_system():
    messages = [
        {"role": "system", "content": "You are a Python expert. Keep responses concise."},
        {"role": "user", "content": "How do I read a JSON file in Python?"}
    ]

    result = chat_with_copilot(messages, model_family="gpt-4o")
    print(f"Response: {result['output_text']}")


# Example 3: Multi-turn conversation
def example_conversation():
    messages = [
        {"role": "user", "content": "What is a closure in JavaScript?"},
        {"role": "assistant", "content": "A closure is a function that has access to variables in its outer scope..."},
        {"role": "user", "content": "Can you show me an example?"}
    ]

    result = chat_with_copilot(messages)
    print(f"Response: {result['output_text']}")


# Example 4: Error handling
def example_with_error_handling():
    try:
        messages = [
            {"role": "user", "content": "Hello, Copilot!"}
        ]

        result = chat_with_copilot(messages)
        print(f" Success: {result['output_text'][:100]}...")

    except requests.exceptions.HTTPError as e:
        error_data = e.response.json()
        print(f" Error {e.response.status_code}: {error_data['error']}")
        print(f"  Details: {error_data.get('details', 'N/A')}")

    except requests.exceptions.ConnectionError:
        print(" Connection failed. Is Copilot Bridge running?")


if __name__ == "__main__":
    # Run examples
    print("Example 1: Simple question")
    example_simple()

    print("\n" + "="*60 + "\n")

    print("Example 2: With system message")
    example_with_system()

    print("\n" + "="*60 + "\n")

    print("Example 3: Multi-turn conversation")
    example_conversation()

    print("\n" + "="*60 + "\n")

    print("Example 4: Error handling")
    example_with_error_handling()
```

## Architecture

### Components

1. **HTTP Server**: Node.js built-in `http` module
   - Single endpoint: `POST /v1/chat`
   - Request validation (size, origin, auth)
   - Non-streaming responses

2. **VS Code Language Model Integration**
   - Uses `vscode.lm.selectChatModels()` API
   - Model caching for performance
   - Automatic fallback if family not found

3. **Security**
   - Localhost-only binding (enforced)
   - Optional bearer token authentication
   - Request body size limits

### Message Flow

```
External App ’ HTTP POST ’ Copilot Bridge ’ VS Code LM API ’ Copilot
                                “
External App  HTTP JSON  Buffer Complete Response  Stream
```

## Testing Strategy

### Manual Testing

1. **Start the extension** and verify server starts
2. **Test basic request** with curl:
   ```bash
   curl -X POST http://127.0.0.1:32123/v1/chat \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hello"}]}'
   ```
3. **Test authentication** with token configured
4. **Test error scenarios**:
   - Non-localhost request (should fail)
   - Invalid JSON
   - Missing messages
   - Wrong bearer token

### Python Testing

Run the Python example script provided above to test:
- Simple requests
- System messages
- Multi-turn conversations
- Error handling

### Future Unit Tests

Consider adding:
- Message processing logic tests
- Request validation tests
- Model selection fallback tests

## Troubleshooting

### Server won't start

**Issue**: "Port already in use"
- **Solution**: Change port in settings or stop other service using that port

**Issue**: "No Copilot models available"
- **Solution**: Ensure GitHub Copilot extension is installed and authenticated

### Requests failing

**Issue**: 403 Forbidden
- **Cause**: Request not from localhost
- **Solution**: Ensure you're using 127.0.0.1 or ::1, not external IP

**Issue**: 401 Unauthorized
- **Cause**: Bearer token mismatch
- **Solution**: Check token in settings matches Authorization header

**Issue**: 400 Bad Request
- **Cause**: Invalid request format
- **Solution**: Verify JSON structure matches API specification

### Model issues

**Issue**: Using wrong model
- **Solution**: Specify `model.family` in request or change `defaultFamily` setting

**Issue**: Model selection slow on first request
- **Expected**: First request triggers consent dialog and model selection

## Future Enhancements

- ( Tool calling support
- =Ê Request/response streaming option
- =Ý Request logging to file
- = Model selection per request without caching
- =È Usage statistics

## Security Considerations

- **Localhost Only**: Server only accepts connections from 127.0.0.1/::1
- **Bearer Token**: Optional but recommended for production use
- **No HTTPS**: Use SSH tunneling if remote access needed
- **Rate Limiting**: Consider implementing if needed for your use case

## License

MIT - See LICENSE file for details

## Contributing

Issues and pull requests welcome! Please ensure:
- Code follows existing style
- TypeScript compiles without errors
- Manual testing completed

## Support

For issues related to:
- **This extension**: Open an issue in this repository
- **GitHub Copilot**: Contact GitHub Support
- **VS Code**: Check VS Code documentation

## Acknowledgments

Built using:
- VS Code Extension API
- VS Code Language Model API
- Node.js built-in modules
