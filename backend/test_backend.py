import sys
from pathlib import Path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app
import json

def test():
    client = app.test_client()
    
    # 1. Test frontend connected and served
    r = client.get('/')
    assert r.status_code == 200
    assert b'PharmaNear' in r.data
    print("[OK] Frontend connected! index.html served from backend.")

    # 2. Test user dashboard served
    r = client.get('/user-dashboard.html')
    assert r.status_code == 200
    assert b'Customer Portal' in r.data
    print("[OK] User dashboard connected and served.")

    # 3. Test API search
    r = client.get('/api/search?q=dolo')
    assert r.status_code == 200
    d = json.loads(r.data)
    assert len(d['results']) > 0
    print(f"[OK] Backend API working! Found {len(d['results'])} medicine results.")

    # 4. Test Pharmacies
    r = client.get('/api/pharmacies')
    assert r.status_code == 200
    d = json.loads(r.data)
    assert len(d['pharmacies']) >= 12
    print(f"[OK] Pharmacy Locator API working! Found {len(d['pharmacies'])} stores.")

    print("\n>>> FRONTEND AND BACKEND ARE FULLY CONNECTED AND FUNCTIONAL! <<<")

if __name__ == '__main__':
    test()
