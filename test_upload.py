import requests
import time

ws_url = "http://localhost:8001/api/v1/workspaces"
ws_data = {"name": "Test Workspace", "description": "Testing"}
res = requests.post(ws_url, json=ws_data)
print("Create Workspace:", res.json())
ws_id = res.json()["id"]

upload_url = f"http://localhost:8001/api/v1/workspaces/{ws_id}/documents"
with open("sample_data.txt", "rb") as f:
    files = {"files": ("sample_data.txt", f, "text/plain")}
    data = {"unit": "General"}
    res = requests.post(upload_url, files=files, data=data)
print("Upload Document:", res.json())

# Wait for ingestion
for _ in range(30):
    time.sleep(2)
    doc_res = requests.get(upload_url)
    docs = doc_res.json()
    status = docs[0]["status"]
    print(f"Status: {status}")
    if status in ["indexed", "failed"]:
        break
