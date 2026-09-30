import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ScholarRAG"
    assert "tagline" in data

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "memory" in data
    assert "llm_connection" in data

def test_settings_endpoint(client):
    response = client.get("/api/v1/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "ScholarRAG"
    assert "default_llm_provider" in data

def test_workspace_crud(client):
    # 1. Create workspace
    create_res = client.post(
        "/api/v1/workspaces",
        json={
            "name": "Engineering Physics 101",
            "description": "Quantum mechanics and wave optics",
            "mode": "standard",
            "color_theme": "violet",
            "icon": "sparkles"
        }
    )
    assert create_res.status_code == 201
    ws = create_res.json()
    assert ws["name"] == "Engineering Physics 101"
    ws_id = ws["id"]
    
    # 2. Get workspace
    get_res = client.get(f"/api/v1/workspaces/{ws_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == ws_id
    
    # 3. List workspaces
    list_res = client.get("/api/v1/workspaces")
    assert list_res.status_code == 200
    assert any(w["id"] == ws_id for w in list_res.json())
    
    # 4. Delete workspace
    del_res = client.delete(f"/api/v1/workspaces/{ws_id}")
    assert del_res.status_code == 200
