import time
import httpx

client = httpx.Client(base_url='http://127.0.0.1:8000/api/v1', timeout=30.0)

# 1. Create workspace
ws_res = client.post('/workspaces', json={'name': 'Quantum Physics 201', 'description': 'Quantum mechanics notes'})
ws = ws_res.json()
print('Workspace created:', ws['id'], ws['name'])

# 2. Upload sample PDF
with open('backend/sample_data/quantum_mechanics_intro.pdf', 'rb') as f:
    files = {'files': ('quantum_mechanics_intro.pdf', f, 'application/pdf')}
    data = {'unit': 'Unit 1: Quantum Foundations'}
    up_res = client.post(f"/workspaces/{ws['id']}/documents", files=files, data=data)
    print('Upload response:', up_res.json())

# 3. Poll for ingestion completion
for _ in range(10):
    time.sleep(1)
    doc_res = client.get(f"/workspaces/{ws['id']}/documents")
    docs = doc_res.json()
    if docs and docs[0]['status'] == 'indexed':
        print('Document successfully indexed:', docs[0])
        break
    else:
        print('Ingestion status:', docs[0]['status'] if docs else 'waiting...')
