#!/usr/bin/env python3
"""
Example client for Copilot Bridge VS Code Extension

Usage:
    python example_client.py
"""

import requests
import json
import sys

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
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Is Copilot Bridge running in VS Code?")
        print("   Start it with: Cmd+Shift+P → 'Copilot Bridge: Start'")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        error_data = e.response.json() if e.response.headers.get('content-type') == 'application/json' else {}
        print(f"❌ HTTP Error {e.response.status_code}: {error_data.get('error', 'Unknown')}")
        print(f"   Details: {error_data.get('details', 'N/A')}")
        sys.exit(1)


def print_separator():
    print("\n" + "=" * 70 + "\n")


def example_simple():
    """Example 1: Simple question"""
    print("📝 Example 1: Simple question")
    print("-" * 70)
    
    messages = [
        {"role": "user", "content": "What is TypeScript in one sentence?"}
    ]
    
    print(f"Request: {messages[0]['content']}")
    result = chat_with_copilot(messages)
    
    print(f"\n✅ Response ({result['id']}):")
    print(f"   Model: {result['model']['vendor']}/{result['model']['family']}")
    print(f"   Duration: {result['meta']['startedAt']} → {result['meta']['endedAt']}")
    print(f"\n{result['output_text']}")


def example_with_system():
    """Example 2: With system message"""
    print("📝 Example 2: With system message")
    print("-" * 70)
    
    messages = [
        {"role": "system", "content": "You are a Python expert. Keep responses concise and practical."},
        {"role": "user", "content": "How do I read a JSON file in Python?"}
    ]
    
    print(f"System: {messages[0]['content']}")
    print(f"User: {messages[1]['content']}")
    
    result = chat_with_copilot(messages, model_family="gpt-4o")
    
    print(f"\n✅ Response ({result['id']}):")
    print(f"\n{result['output_text']}")


def example_conversation():
    """Example 3: Multi-turn conversation"""
    print("📝 Example 3: Multi-turn conversation")
    print("-" * 70)
    
    messages = [
        {"role": "user", "content": "What is a Python decorator?"},
        {"role": "assistant", "content": "A decorator is a function that modifies the behavior of another function or method. It uses the @decorator syntax above a function definition."},
        {"role": "user", "content": "Show me a simple example with timing."}
    ]
    
    print("Turn 1 (User):", messages[0]['content'])
    print("Turn 2 (Assistant):", messages[1]['content'][:60] + "...")
    print("Turn 3 (User):", messages[2]['content'])
    
    result = chat_with_copilot(messages)
    
    print(f"\n✅ Response ({result['id']}):")
    print(f"\n{result['output_text']}")


def example_interactive():
    """Example 4: Interactive chat"""
    print("📝 Example 4: Interactive chat")
    print("-" * 70)
    print("Type 'exit' or 'quit' to end the conversation\n")
    
    messages = []
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            if not user_input:
                continue
            
            messages.append({"role": "user", "content": user_input})
            
            result = chat_with_copilot(messages)
            assistant_response = result['output_text']
            
            print(f"\nCopilot: {assistant_response}\n")
            
            # Add assistant response to conversation history
            messages.append({"role": "assistant", "content": assistant_response})
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            break


def main():
    print("=" * 70)
    print("Copilot Bridge - Python Client Examples")
    print("=" * 70)
    
    # Check if requests is installed
    try:
        import requests
    except ImportError:
        print("❌ Error: 'requests' library not found")
        print("   Install with: pip install requests")
        sys.exit(1)
    
    try:
        # Run examples
        print_separator()
        example_simple()
        
        print_separator()
        example_with_system()
        
        print_separator()
        example_conversation()
        
        print_separator()
        example_interactive()
        
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
