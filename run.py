import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

from app import app, db

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print("==================================================")
    print(" PharmaNear Server Running!")
    print(" Connecting Frontend <-> Backend Seamlessly")
    print(" Access: http://localhost:5000")
    print("==================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)
