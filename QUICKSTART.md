# Quick Start Guide

Get up and running with Copilot Bridge in 5 minutes!

## Prerequisites

✅ VS Code 1.85.0+
✅ GitHub Copilot extension installed
✅ Active GitHub Copilot subscription

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Compile

```bash
npm run compile
```

## Step 3: Run the Extension

Press **F5** in VS Code to launch the extension in debug mode.

A new VS Code window will open with the extension loaded.

## Step 4: Start the Bridge

In the new VS Code window:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **Copilot Bridge: Start**
3. Press Enter

You'll see a notification: "Copilot Bridge started on http://127.0.0.1:32123/v1/chat"

## Step 5: Test with cURL

Open a terminal and run:

```bash
curl -X POST http://127.0.0.1:32123/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is TypeScript?"}
    ]
  }'
```

You should see a JSON response with Copilot's answer!

## Step 6: Test with Python

Install Python requests library:

```bash
pip install requests
```

Run the example client:

```bash
python example_client.py
```

This will run through several examples and then enter interactive mode.

## Configuration (Optional)

Open VS Code settings (`Cmd+,` / `Ctrl+,`) and search for "Copilot Bridge":

- **Port**: Default 32123
- **Token**: Leave empty for no auth, or set a bearer token
- **Default Family**: "gpt-4o" (default)
- **Max Body Bytes**: 1000000 (default)

## Troubleshooting

**Problem**: "No Copilot models available"
**Solution**: Ensure GitHub Copilot extension is authenticated

**Problem**: "Port already in use"
**Solution**: Change the port in settings or stop the service using port 32123

**Problem**: Python client can't connect
**Solution**: Make sure the bridge is started (Step 4)

## Next Steps

- Read the full [README.md](README.md) for detailed API documentation
- Integrate with your Python/Node.js application
- Set up bearer token authentication for production use
- Check the Output panel "Copilot Bridge" for detailed logs

## Stopping the Bridge

1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type: **Copilot Bridge: Stop**
3. Press Enter

Happy coding! 🚀
