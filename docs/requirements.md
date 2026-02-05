# Requirements

Core functional requirements for Copilot Bridge.

## Purpose

Expose GitHub Copilot models via a local HTTP API that is compatible with OpenAI's Chat/Completion API format, enabling external tools to use Copilot models as drop-in replacements for OpenAI endpoints.

## Functional Requirements

### 1. Model Re-Export

**Requirement**: Expose available GitHub Copilot models via API endpoint.

**Details**:
- Must provide `/v1/models` endpoint
- Must return list of available Copilot models (via VS Code Language Model API)
- Must include model metadata (vendor, family, capabilities)
- Response format must be compatible with OpenAI `/v1/models` schema

**Rationale**: External tools need to discover available models before making chat requests.

### 2. OpenAI Chat/Completion API Compatibility

**Requirement**: Provide OpenAI-compatible chat completion endpoint.

**Details**:
- Must support `/v1/chat/completions` endpoint (OpenAI standard path)
- Must accept OpenAI request schema:
  ```json
  {
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "..."},
      {"role": "user", "content": "..."}
    ]
  }
  ```
- Must return OpenAI response schema:
  ```json
  {
    "id": "chatcmpl-...",
    "object": "chat.completion",
    "created": 1234567890,
    "model": "gpt-4o",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "..."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 20,
      "total_tokens": 30
    }
  }
  ```
- Must map Copilot model families to OpenAI-compatible model names
- Should support common OpenAI request parameters (model, messages, temperature, max_tokens)

**Rationale**: Allows external tools (Python OpenAI client, curl scripts, etc.) to use Copilot as a drop-in replacement for OpenAI API without code changes.

## Technical Constraints

### Security
- Must bind to localhost only (127.0.0.1/::1)
- Should support optional bearer token authentication
- Must validate request body size limits

### VS Code Integration
- Must use VS Code Language Model API (`vscode.lm`) for model access
- Must handle Copilot consent dialogs gracefully
- Must activate/deactivate cleanly with extension lifecycle

### Response Format
- Must support non-streaming responses (buffered)
- Should support streaming responses (future enhancement)
- Must handle model unavailability with appropriate error codes

## Compatibility Matrix

| Feature                | OpenAI API | Copilot Bridge | Status  |
|------------------------|-----------------------------|---------|
| `/v1/models`           | ✅         | ✅ Required     | Planned |
| `/v1/chat/completions` | ✅         | ✅ Required     | Planned |
| Request schema         | ✅         | ✅ Required     | Planned |
| Response schema        | ✅         | ✅ Required     | Planned |
| Streaming              | ✅         | ⏳ Optional     | Future  |
| Function calling       | ✅         | ⏳ Future       | Future  |
| Temperature parameter  | ✅         | ⏳ Optional     | Future  |
| max_tokens parameter   | ✅         | ⏳ Optional     | Future  |

## Success Criteria

1. External OpenAI client libraries (Python `openai`, JavaScript `openai`) can connect without modification (only changing base URL)
2. `/v1/models` returns list of available Copilot models
3. `/v1/chat/completions` accepts and responds with OpenAI-compatible JSON
4. Existing functionality (localhost security, bearer token, message processing) remains intact

## Implementation Notes

### Migration Strategy
- Keep existing custom endpoint (`POST /v1/chat`) for backward compatibility
- Add new OpenAI-compatible endpoints (`/v1/models`, `/v1/chat/completions`)
- Map between custom DTOs and OpenAI schemas at adapter boundary
- Document both APIs in README

### Model Mapping
- Map Copilot model families to OpenAI model names:
  - `gpt-4o` → GitHub Copilot GPT-4o family
  - `gpt-3.5-turbo` → GitHub Copilot GPT-3.5-turbo family
- Preserve original Copilot model metadata in extended response fields

### Token Usage
- VS Code Language Model API does not provide token counts
- Token usage in response should be estimated or omitted (set to 0)
- Document this limitation in API reference

## References

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- Current implementation: `src/adapters/input/http-server/`
