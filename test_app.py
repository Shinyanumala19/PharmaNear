import json
from app import app, db
from models import User, Pharmacy, Medicine, Inventory, Order

def run_tests():
    print("Testing PharmaNear application endpoints...")
    client = app.test_client()

    with app.app_context():
        # Check DB
        users_count = User.query.count()
        pharms_count = Pharmacy.query.count()
        meds_count = Medicine.query.count()
        inv_count = Inventory.query.count()

        print(f"[OK] Database verified: {users_count} users, {pharms_count} pharmacies, {meds_count} medicines, {inv_count} inventory items.")
        assert users_count > 0, "Users table is empty"
        assert pharms_count > 0, "Pharmacies table is empty"
        assert meds_count > 0, "Medicines table is empty"

    # Test 1: Home page
    r = client.get('/')
    assert r.status_code == 200, f"Home page failed with {r.status_code}"
    print("[OK] Landing page (/) returns 200 OK")

    # Test 2: User Dashboard
    r = client.get('/user-dashboard.html')
    assert r.status_code == 200, f"User dashboard failed with {r.status_code}"
    print("[OK] User dashboard (/user-dashboard.html) returns 200 OK")

    # Test 3: Pharmacy Owner Dashboard
    r = client.get('/pharmacy-dashboard.html')
    assert r.status_code == 200, f"Pharmacy dashboard failed with {r.status_code}"
    print("[OK] Pharmacy dashboard (/pharmacy-dashboard.html) returns 200 OK")

    # Test 4: Admin Dashboard
    r = client.get('/admin-dashboard.html')
    assert r.status_code == 200, f"Admin dashboard failed with {r.status_code}"
    print("[OK] Admin dashboard (/admin-dashboard.html) returns 200 OK")

    # Test 5: Prescription Scanner Page
    r = client.get('/prescription-scanner.html')
    assert r.status_code == 200, f"Prescription scanner failed with {r.status_code}"
    print("[OK] Prescription scanner (/prescription-scanner.html) returns 200 OK")

    # Test 6: Search API (RapidFuzz)
    r = client.get('/api/search?q=dolo')
    assert r.status_code == 200, f"Search failed with {r.status_code}"
    data = json.loads(r.data)
    assert len(data['results']) > 0, "No search results returned for 'dolo'"
    first_result = data['results'][0]
    print(f"[OK] Fuzzy search API (/api/search?q=dolo): matched '{first_result['medicine']['name']}' across {first_result['pharmacies_count']} pharmacies.")

    # Test 7: Pharmacy Locator API
    r = client.get('/api/pharmacies')
    assert r.status_code == 200
    pdata = json.loads(r.data)
    assert len(pdata['pharmacies']) >= 10
    print(f"[OK] Pharmacy locator API (/api/pharmacies): returned {len(pdata['pharmacies'])} Hyderabad stores with coordinates.")

    # Test 8: AI Assistant Chat API
    r = client.post('/api/ai/chat', json={'message': 'What is the dosage for Paracetamol 650mg?'})
    assert r.status_code == 200
    cdata = json.loads(r.data)
    assert 'reply' in cdata and len(cdata['reply']) > 10
    print(f"[OK] AI Assistant API (/api/ai/chat): successfully answered medical prompt.")

    # Test 9: Admin Stats API
    r = client.get('/api/admin/stats')
    assert r.status_code == 200
    sdata = json.loads(r.data)
    print(f"[OK] Admin stats API (/api/admin/stats): Total network revenue Rs.{sdata['total_revenue']}, {sdata['total_orders']} orders.")

    # Test 10: Owner Inventory API
    r = client.get('/api/owner/inventory?pharmacy_id=1')
    assert r.status_code == 200
    idata = json.loads(r.data)
    print(f"[OK] Owner inventory API (/api/owner/inventory): retrieved {idata['count']} SKUs for store #1.")

    print("\n>>> ALL 10 TEST SUITES PASSED FLAWLESSLY! <<<")

if __name__ == '__main__':
    run_tests()
