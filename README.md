# 💊 PharmaNear: AI-Based Medicine Availability & Pharmacy Locator

> **A production-ready healthcare web application connecting patients, local pharmacies, and administrators with real-time medicine availability, price comparison, AI prescription scanning, interactive mapping, and instant reservations.**

![PharmaNear Banner](frontend/assets/images/hero-banner.jpg)

---

## 🌟 Key Highlights & Features

### 👤 1. Customer Medicine Hub
- **Fuzzy Medicine Search (RapidFuzz)**: High-speed typo-tolerant search across 58+ cataloged medicines and therapeutic categories.
- **Real-Time Cross-Pharmacy Price Comparison**: Side-by-side comparison tables highlighting **Best Price**, **Nearest Store**, and **Savings Percentage (up to 45%)**.
- **Interactive OpenStreetMap / Leaflet.js**: Hyderabad geo-locator plotting verified pharmacies with custom pins, live distances (Haversine formula), store hours, and direct counter reservations.
- **Instant Stock Hold / Order System**: 1-click counter pickup reservations (held for 24 hours) or home delivery orders.
- **Real-Time Order Tracking**: Live status monitor (`Pending` ➔ `Confirmed` ➔ `Ready for Pickup` ➔ `Completed`).
- **AI Medical Assistant**: Interactive chatbot capable of advising on dosages, active generics, food interactions, and nearby stock.

### 📄 2. AI Prescription Scanner
- **OCR Vision Analysis**: Upload photo or PDF prescriptions for automatic detection of medicine names, strengths, dosage schedules, and quantities.
- **Cross-Store Inventory Lookup**: Instantly verifies which Hyderabad stores have all prescribed items in stock with 1-click hold.

### 🏪 3. Pharmacy Owner Portal
- **Inventory CRUD & Stock Control**: Add new medicine SKUs, update real-time prices, adjust stock levels, track batch numbers and expiration dates.
- **Proactive Alerts Center**:
  - **Low Stock Warnings**: Automated alerts for any medicine under 10 units with 1-click +50 restock button.
  - **Near Expiry Radar**: Identifies stock expiring within 60 days to prevent wastage.
- **Incoming Orders & Reservations Manager**: Update statuses (`Confirm Hold`, `Ready for Pickup`, `Completed`, `Cancelled`) with automated live customer notification dispatch.

### ⚡ 4. SuperAdmin Control Center
- **System Analytics (Chart.js)**:
  - Doughnut breakdown of catalog by therapeutic categories.
  - Bar chart of inventory capacity across Hyderabad pharmacies.
  - 7-day orders and reservations trendline.
- **Pharmacy Partner Moderation**: Approve or suspend partner stores with 1 click.
- **User Management**: View and audit all customer, pharmacy owner, and admin accounts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Python 3.11+, Flask 3.1 |
| **Database & ORM** | SQLite, Flask-SQLAlchemy 3.1 |
| **Authentication** | Flask-Login with Werkzeug PBKDF2 Password Hashing |
| **Search Engine** | RapidFuzz (Token Set Ratio fuzzy matching) |
| **Geolocation** | Haversine Formula + HTML5 Geolocation API |
| **Maps & Geospatial** | Leaflet.js + OpenStreetMap |
| **Charts & Analytics** | Chart.js |
| **AI Integration** | Google Generative AI (Gemini 1.5 Flash) + Fallback Clinical Engine |
| **Frontend UI/UX** | HTML5, Vanilla CSS Design System, Glassmorphism, Bootstrap-compatible grid, Lucide Icons |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
Ensure Python 3.10+ is installed on your machine.

### 2. Clone / Open Directory
```bash
cd c:\Users\ASHOK\PharmaNear
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Seed the Database
Populate 12 Hyderabad pharmacies, 58+ medicines, 600+ inventory records, and demo accounts:
```bash
python backend/seed.py
```

### 5. Launch the Server
You can start the backend from either the project root or inside the `backend` folder:

**Option A (From Project Root):**
```bash
python run.py
```

**Option B (From Backend Directory):**
```bash
cd backend
python app.py
```

Open your browser and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

*(The backend connects directly to the `frontend/` folder, serving all pages and live APIs on port 5000 with CORS enabled).*

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Pre-configured Access |
|---|---|---|---|
| **Customer** | `customer@pharmanear.com` | `password123` | Search, compare, map, prescription scanner, orders |
| **Pharmacy Owner** | `apollo@pharmanear.com` | `password123` | Apollo Banjara Hills inventory, orders, alerts |
| **Pharmacy Owner (2)** | `medplus@pharmanear.com` | `password123` | MedPlus Jubilee Hills management |
| **Admin** | `admin@pharmanear.com` | `password123` | SuperAdmin charts, user & store management |

*(You can also register brand new customer or pharmacy owner accounts anytime via `login.html`)*

---

## 📍 Hyderabad Partner Pharmacies Included in Seed

1. **Apollo Pharmacy** — Road No. 2, Banjara Hills (24 Hours Open)
2. **MedPlus Pharmacy** — Road No. 36, Jubilee Hills (7:00 AM - 11:30 PM)
3. **Wellness Forever** — Opp. Cyber Towers, Madhapur IT Corridor (24 Hours Open)
4. **Hetero Pharmacy** — DLF Cyber City Junction, Gachibowli
5. **Frank Ross Pharmacy** — Rasoolpura Metro, Begumpet
6. **Guardian Pharmacy** — Somajiguda Circle, Raj Bhavan Road
7. **LifeCare Pharmacy** — KPHB Metro Pillar 782, Kukatpally
8. **Care & Cure Chemist** — RP Road, Clock Tower, Secunderabad
9. **Royal Medicals** — Gulzar Houz, Charminar
10. **Aster Pharmacy** — Botanical Garden Road, Kondapur
11. **Sri Sai Medical Store** — Ameerpet Cross Roads
12. **MaxCare Drug House** — Konark Theatre Road, Dilsukhnagar

---

## 📂 Project Directory Structure

```
PharmaNear/
├── run.py                      # Root launcher connecting backend <-> frontend
├── .env.example                # Environment configuration template
├── .gitignore                  # Git ignore rules
├── README.md                   # Complete documentation
│
├── backend/                    # Dedicated Backend Service
│   ├── app.py                  # Core Flask REST API, CORS & static server
│   ├── config.py               # Paths, secret keys & DB configuration
│   ├── models.py               # SQLAlchemy database models & UserMixin
│   ├── seed.py                 # Hyderabad database seeder
│   ├── test_backend.py         # Connectivity test suite
│   ├── requirements.txt        # Backend Python dependencies
│   ├── instance/
│   │   └── pharmanear.db       # Seeded SQLite database
│   └── uploads/                # Prescription and image uploads
│
└── frontend/                   # Dedicated Frontend Web Application
    ├── index.html              # Landing page with hero banner & features
    ├── login.html              # Split-panel login & registration
    ├── user-dashboard.html     # Customer search, comparison, map, & orders
    ├── pharmacy-dashboard.html # Store owner inventory CRUD & order dispatch
    ├── admin-dashboard.html    # SuperAdmin analytics & store controls
    ├── prescription-scanner.html # Dedicated AI prescription scanner
    ├── search-compare.html     # Dedicated medicine comparison portal
    │
    ├── css/
    │   ├── main.css            # Root design tokens & theme
    │   ├── components.css      # Reusable buttons, cards, badges
    │   ├── landing.css         # Hero & landing animations
    │   ├── auth.css            # Split auth screen styles
    │   └── dashboard.css       # Complete dashboard design system
    │
    ├── js/
    │   ├── dashboard.js        # Search, Leaflet map, orders, AI chat
    │   ├── pharmacy_owner.js   # Inventory CRUD, status updater, alerts
    │   ├── admin.js            # Chart.js analytics & pharmacy toggles
    │   └── prescription.js     # Upload, AI OCR, & 1-click hold
    │
    └── assets/
        └── images/             # Ultra-HD feature and hero banners
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Register a new customer or pharmacy owner |
| `/api/auth/login` | `POST` | Authenticate user and return session |
| `/api/auth/logout` | `POST` | Clear user session |
| `/api/search` | `GET` | Fuzzy search medicines, calculate distances, and compare prices |
| `/api/pharmacies` | `GET` | Retrieve list of approved pharmacies with coordinates |
| `/api/prescription/scan` | `POST` | Upload prescription image for AI recognition & inventory check |
| `/api/ai/chat` | `POST` | Query AI Medical Assistant for clinical advice |
| `/api/orders` | `POST` | Create a customer counter reservation or delivery order |
| `/api/orders/user` | `GET` | Fetch all orders and reservations for the current customer |
| `/api/owner/inventory` | `GET/POST`| Fetch or add medicine SKUs to pharmacy store |
| `/api/owner/inventory/<id>` | `PUT/DELETE`| Update price/quantity or delete an item |
| `/api/owner/orders` | `GET` | Fetch incoming customer orders for pharmacy |
| `/api/owner/orders/<id>/status`| `PUT` | Update order status (`confirmed`, `ready_for_pickup`, etc.) |
| `/api/owner/alerts` | `GET` | Fetch low-stock (<10) and near-expiry (<60 days) items |
| `/api/admin/stats` | `GET` | Retrieve network-wide totals and revenue |
| `/api/admin/analytics` | `GET` | Retrieve Chart.js dataset for categories, stock, and timeline |
| `/api/admin/pharmacies/<id>/toggle`| `POST` | Approve or suspend a pharmacy partner |

---

## 🚢 Pushing to GitHub

To push this repository to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: PharmaNear AI Medicine Availability & Pharmacy Locator"
git branch -M main
git remote add origin https://github.com/<your-username>/PharmaNear.git
git push -u origin main
```

---
*Built with care for accessible, transparent, and immediate healthcare.*
