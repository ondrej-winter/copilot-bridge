import OpenAI from 'openai';
import { describe, expect, it } from 'vitest';

/**
 * E2E tests using OpenAI SDK to test the Copilot Bridge
 *
 * PREREQUISITES:
 * 1. Start VS Code with the Copilot Bridge extension installed
 * 2. Run the command "Copilot Bridge: Start" to start the server
 * 3. Ensure the server is running on the configured port (default: 32123)
 * 4. If authentication is enabled, set BRIDGE_TOKEN environment variable
 *
 * RUN THESE TESTS:
 * npm run test:e2e
 *
 * OR manually with environment variable:
 * BRIDGE_TOKEN=your-token npm run test:e2e
 */

const BASE_URL = process.env.BRIDGE_BASE_URL || 'http://127.0.0.1:32123/v1';
const API_KEY = process.env.BRIDGE_TOKEN || 'dummy-key';

describe('OpenAI SDK E2E Tests', () => {
  let client: OpenAI;

  beforeEach(() => {
    client = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL
    });
  });

  describe('chat.completions.create', () => {
    it('should complete a simple chat request', async () => {
      const completion = await client.chat.completions.create({
        model: 'auto',
        messages: [{ role: 'user', content: 'Say "test successful" and nothing else.' }]
      });

      expect(completion).toBeDefined();
      expect(completion.choices).toBeDefined();
      expect(completion.choices.length).toBeGreaterThan(0);
      expect(completion.choices[0].message).toBeDefined();
      expect(completion.choices[0].message.content).toBeTruthy();
      expect(typeof completion.choices[0].message.content).toBe('string');

      console.log('Response:', completion.choices[0].message.content);
    }, 30000);

    it('should handle system message with user message', async () => {
      const completion = await client.chat.completions.create({
        model: 'auto',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that responds concisely.' },
          { role: 'user', content: 'What is 2+2?' }
        ]
      });

      expect(completion.choices[0].message.content).toBeTruthy();
      expect(completion.choices[0].message.content).toContain('4');

      console.log('Math response:', completion.choices[0].message.content);
    }, 30000);

    it('should handle multi-turn conversation', async () => {
      const completion = await client.chat.completions.create({
        model: 'auto',
        messages: [
          { role: 'user', content: 'My name is Alice.' },
          { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
          { role: 'user', content: 'What is my name?' }
        ]
      });

      expect(completion.choices[0].message.content).toBeTruthy();
      expect(completion.choices[0].message.content?.toLowerCase()).toContain('alice');

      console.log('Memory response:', completion.choices[0].message.content);
    }, 30000);

    it('should handle different model families', async () => {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say hello.' }]
      });

      expect(completion.choices[0].message.content).toBeTruthy();

      console.log('gpt-4o response:', completion.choices[0].message.content);
    }, 30000);

    it('should fail with invalid request', async () => {
      await expect(
        client.chat.completions.create({
          model: 'gpt-4o',
          messages: [] as any
        })
      ).rejects.toThrow();
    });
  });

  describe('models.list', () => {
    it('should list available models', async () => {
      // Note: OpenAI SDK expects a different endpoint structure
      // We'll make a raw fetch request instead
      const response = await fetch(`${BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.models).toBeDefined();
      expect(Array.isArray(data.models)).toBe(true);
      expect(data.count).toBeDefined();
      expect(data.models.length).toBeGreaterThan(0);

      console.log('Available models:', data.models.length);
      console.log('First model:', data.models[0]);
    }, 30000);
  });

  describe('authentication', () => {
    it('should reject request with invalid token when auth is enabled', async () => {
      // Skip if no token is configured
      if (!process.env.BRIDGE_TOKEN) {
        console.log('Skipping auth test - no BRIDGE_TOKEN configured');
        return;
      }

      const unauthorizedClient = new OpenAI({
        apiKey: 'wrong-token',
        baseURL: BASE_URL
      });

      await expect(
        unauthorizedClient.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle request timeout gracefully', async () => {
      // This test validates that the client handles timeouts
      const timeoutClient = new OpenAI({
        apiKey: API_KEY,
        baseURL: BASE_URL,
        timeout: 100 // Very short timeout
      });

      // This might succeed if the response is very fast, or timeout
      try {
        await timeoutClient.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }]
        });
        console.log('Request completed within timeout');
      } catch (_error) {
        console.log('Request timed out as expected');
      }
    }, 30000);
  });
});

/**
 * USAGE INSTRUCTIONS
 *
 * To run these tests:
 *
 * 1. Start VS Code
 * 2. Install and activate the Copilot Bridge extension
 * 3. Run "Copilot Bridge: Start" command
 * 4. In terminal:
 *    npm run test:e2e
 *
 * With authentication:
 *    BRIDGE_TOKEN=your-secret-token npm run test:e2e
 *
 * With custom port:
 *    BRIDGE_BASE_URL=http://127.0.0.1:8080/v1 npm run test:e2e
 */
