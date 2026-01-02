# MunLink Region 3

> Municipal Digital Governance Platform for Region 3, Philippines

## 🎯 Project Overview

MunLink is a multi-tenant digital governance platform designed for municipalities in Region 3, Philippines. It provides unified digital infrastructure for municipal government services while enabling cross-municipal community engagement through a shared marketplace platform.

## 🚀 Technology Stack

### Backend
- **Framework**: Flask 3.0+
- **Database**: PostgreSQL 15+ (production) / SQLite (development)
- **ORM**: SQLAlchemy 2.0+
- **Authentication**: JWT with bcrypt
- **Language**: Python 3.10+

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript 5+
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 3+
- **Routing**: React Router 6+

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker + Docker Compose
- **Package Manager**: npm (workspaces)

## 📁 Project Structure

```
munlink/
├── apps/                    # Applications
│   ├── api/                # Flask backend API
│   ├── web/                # Public website (React)
│   └── admin/              # Admin dashboard (React)
├── packages/               # Shared packages
│   └── ui/                 # Shared UI components
├── public/                 # Static assets
│   ├── logos/              # Municipal logos
│   ├── landmarks/          # Landmark photos
│   └── digital_docs_template/  # Document templates
├── data/                   # Reference data
│   └── locations/          # Geographic data (JSON)
├── scripts/                # Development scripts
└── uploads/                # Runtime file storage (gitignored)
```

## 🛠️ Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+ (or use SQLite for development)
- Docker & Docker Compose (optional)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/itszoriel/Munlink-reg-3.git
cd Munlink-reg-3

# 2. Install root dependencies
npm install

# 3. Setup environment
# Create a .env file with your configuration (see .env.example)

# 4. Setup backend
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 5. Setup database
flask db upgrade
python scripts/seed_data.py

# 6. Setup frontend
cd ../web
npm install

cd ../admin
npm install

# 7. Return to root
cd ../..
```

### Development

```bash
# Run all services (from root)
npm run dev

# Or run individually:

# Backend API (Terminal 1)
cd apps/api
source venv/bin/activate
python app.py

# Web Frontend (Terminal 2)
cd apps/web
npm run dev

# Admin Dashboard (Terminal 3)
cd apps/admin
npm run dev
```

### Access Points

- **Public Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **API**: http://localhost:5000

## 🔑 Key Features

### For Residents (18+)
- ✅ Cross-municipal marketplace (donate, lend, sell)
- ✅ Municipal document requests (22 document types)
- ✅ Problem reporting (infrastructure, safety, environmental)
- ✅ Programs with Benefits application (municipal assistance programs)
- ✅ QR code document verification

### For Municipal Admins
- ✅ User ID verification
- ✅ Document processing and generation
- ✅ Problem management and tracking
- ✅ Programs with Benefits management
- ✅ Municipal announcements
- ✅ Analytics and reporting

## 🔒 Security

- Two-tier verification (email + admin ID)
- Age-based access control (18+ for transactions)
- Municipal data isolation
- JWT authentication with token blacklisting
- Bcrypt password hashing
- Admin dashboard (internal network only)

## 🚢 Deployment

### Docker (Recommended)

```bash
docker-compose up -d
```

### Manual Deployment

Deploy on Render.com using the included `render.yaml` configuration file.

## 📊 Database

**Tables**: 15+ core models

- Users & Authentication
- Municipalities (13 records)
- Marketplace (Items, Transactions, Messages)
- Documents (Types, Requests, QR Codes)
- Issues & Benefits
- Notifications & Activity Logs

## 🤝 Contributing

This is a government project for Region 3 - Central Luzon. Contact the project maintainers for contribution guidelines.

## 📄 License

Proprietary - Region 3 Provincial Governments

## 📞 Support

For technical support, contact Princhprays :>.

---

**Built for the people of Region 3** 🇵🇭

