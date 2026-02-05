# HTTP API Patterns: localhost binding, error handling, validation

Use these patterns for HTTP servers in local development VS Code extensions.

## Localhost binding
- **Should** bind HTTP servers to `127.0.0.1` for local-only access
- Prevents accidental network exposure

### Simple binding pattern
```typescript
httpServer.listen(port, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${port}`);
});
```

## Request body validation
- **Should** validate request body size to prevent memory issues
- **Should** handle JSON parsing errors gracefully
- **Should** validate required fields

### Body size limit pattern
```typescript
async function readBodyWithLimit(
  req: http.IncomingMessage, 
  maxBytes: number
): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw new Error(`Request body exceeds ${maxBytes} bytes`);
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}
```

### JSON parsing pattern
```typescript
let requestData: any;
try {
  requestData = JSON.parse(body);
} catch (err) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Bad Request', 
    details: 'Invalid JSON' 
  }));
  return;
}

// Validate required fields
if (!requestData.messages || !Array.isArray(requestData.messages)) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Bad Request', 
    details: 'messages array is required' 
  }));
  return;
}
```

## Error responses
- **Should** return consistent error response format
- **Should** use appropriate HTTP status codes
- **Should** include helpful error messages for debugging

### Error response pattern
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
}

function sendError(
  res: http.ServerResponse, 
  status: number, 
  error: string, 
  details?: string
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  const response: ErrorResponse = { error };
  if (details) {
    response.details = details;
  }
  res.end(JSON.stringify(response));
}

// Usage
sendError(res, 400, 'Bad Request', 'messages array is required');
sendError(res, 404, 'Not Found', `Unknown endpoint: ${req.url}`);
sendError(res, 500, 'Internal Server Error', err.message);
```

## CORS handling
- **Should** set CORS headers to allow browser-based clients

### CORS pattern
```typescript
// Set CORS headers
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

// Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  res.writeHead(204);
  res.end();
  return;
}
```

## Logging
- **Should** log request handling for debugging
- Include request method, URL, and response status

### Logging pattern
```typescript
outputChannel.appendLine(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${statusCode}`);
```
