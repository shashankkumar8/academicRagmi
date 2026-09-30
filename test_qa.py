import requests
import json
import sys

ws_url = "http://localhost:8001/api/v1/workspaces"
res = requests.get(ws_url)
if not res.ok:
    print("Failed to get workspaces:", res.text)
    sys.exit(1)
workspaces = res.json()
if not workspaces:
    print("No workspaces found.")
    sys.exit(1)

ws_id = workspaces[0]["id"]
print(f"Using workspace: {ws_id}")

ask_url = f"http://localhost:8001/api/v1/workspaces/{ws_id}/ask"
payload = {
    "workspace_id": ws_id,
    "question": "What does RAG combine?",
    "stream": False
}

print("Asking question...")
res = requests.post(ask_url, json=payload)
if not res.ok:
    print("Failed to ask question:", res.text)
else:
    print("Answer Stream:")
    print(res.text)
