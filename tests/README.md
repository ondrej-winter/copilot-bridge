# Test Suite for Copilot Bridge

Comprehensive test suite following hexagonal architecture principles.

## Test Structure

```
tests/
├── unit/                          # Fast, isolated unit tests
│   ├── domain/                    # Domain layer tests
│   │   ├── entities/              # Entity tests
│   │   ├── value-objects/         # Value object tests
│   │   └── exceptions.test.ts     # Domain exception tests
│   ├── application/               # Application layer tests
│   │   └── use-cases/             # Use case tests (with mocked ports)
│   └── adapters/                  # Adapter unit tests
│       └── input/http-server/     # HTTP server adapter tests
├── integration/                   # Integration tests with I/O
│   └── adapters/                  # Full adapter integration tests
└── e2e/                           # End-to-end tests
    └── openai-client.e2e.test.ts  # OpenAI SDK integration tests
```

## Running Tests

### All Tests (excluding E2E)
```bash
npm test
```

### Unit Tests Only (Fastest)
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests (Requires Running Extension)
```bash
npm run test:e2e
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## Test Pyramid

- **Unit Tests** (~80%): Fast, isolated, no external dependencies
  - Domain entities and value objects
  - Use cases with mocked ports
  - Adapter validation and routing logic

- **Integration Tests** (~15%): Real HTTP server, mocked Language Model
  - Full HTTP server lifecycle
  - Request/response handling
  - Authentication and CORS

- **E2E Tests** (~5%): Full system with OpenAI SDK
  - Requires manual setup (extension must be running)
  - Tests real-world usage patterns
  - Validates API contract

## E2E Test Prerequisites

The E2E tests use the OpenAI SDK to test the bridge as a real client would.

### Setup
1. Start VS Code with Copilot Bridge extension installed
2. Run command: **Copilot Bridge: Start**
3. Wait for server to start (check output panel)

### Run E2E Tests
```bash
# Without authentication
npm run test:e2e

# With authentication
BRIDGE_TOKEN=your-secret-token npm run test:e2e

# With custom port
BRIDGE_BASE_URL=http://127.0.0.1:8080/v1 npm run test:e2e
```

### Environment Variables
- `BRIDGE_BASE_URL`: Base URL of the bridge (default: `http://127.0.0.1:32123/v1`)
- `BRIDGE_TOKEN`: Bearer token for authentication (default: `dummy-key`)

## Writing Tests

### Unit Tests
Use mocks for all external dependencies:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyClass', () => {
  let mockPort: MyPort;
  
  beforeEach(() => {
    mockPort = {
      method: vi.fn().mockResolvedValue('result')
    };
  });
  
  it('should do something', async () => {
    const instance = new MyClass(mockPort);
    const result = await instance.doSomething();
    
    expect(result).toBe('expected');
    expect(mockPort.method).toHaveBeenCalledOnce();
  });
});
```

### Integration Tests
Use real adapters with mocked infrastructure:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('HTTP Server Integration', () => {
  let server: HttpServerAdapter;
  
  beforeEach(async () => {
    // Setup with mocked ports
    server = new HttpServerAdapter(/* ... */);
    await server.start();
  });
  
  afterEach(async () => {
    if (server.isRunning()) {
      await server.stop();
    }
  });
  
  it('should handle request', async () => {
    const response = await fetch('http://127.0.0.1:port/endpoint');
    expect(response.ok).toBe(true);
  });
});
```

### E2E Tests
Test real-world usage patterns:

```typescript
import { describe, it, expect } from 'vitest';
import OpenAI from 'openai';

describe('OpenAI SDK E2E', () => {
  it('should complete chat request', async () => {
    const client = new OpenAI({
      apiKey: process.env.BRIDGE_TOKEN || 'dummy',
      baseURL: 'http://127.0.0.1:32123/v1'
    });
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    
    expect(completion.choices[0].message.content).toBeTruthy();
  }, 30000);
});
```

## Coverage

Generate coverage report:
```bash
npm run test:coverage
```

View HTML report:
```bash
open coverage/index.html
```

### Coverage Targets
- Domain layer: >90%
- Application layer: >85%
- Adapters: >75%
- Overall: >80%

## Debugging Tests

### Run single test file
```bash
npx vitest run tests/unit/domain/entities/ChatMessage.test.ts
```

### Run tests matching pattern
```bash
npx vitest run -t "ChatMessage"
```

### Debug in VS Code
1. Add breakpoint in test or source code
2. Use "JavaScript Debug Terminal" in VS Code
3. Run: `npm test`

## CI Integration

Tests run automatically in CI pipeline:
```bash
npm run compile  # TypeScript compilation
npm run lint     # Linting
npm test         # Run test suite (unit + integration)
```

Note: E2E tests are not run in CI as they require the extension to be running.

## Troubleshooting

### Tests fail with import errors
```bash
npm install
```

### Integration tests fail with port conflicts
The integration tests use random ports (33000-34000). If you see "EADDRINUSE", restart the tests.

### E2E tests fail with connection refused
Ensure the Copilot Bridge extension is running:
1. Open VS Code
2. Run command: **Copilot Bridge: Start**
3. Check output panel for "Listening on..." message

### E2E tests fail with 401 Unauthorized
Set the correct bearer token:
```bash
BRIDGE_TOKEN=your-token npm run test:e2e
```

Or disable authentication in VS Code settings:
```json
{
  "copilotBridge.token": ""
}
```
