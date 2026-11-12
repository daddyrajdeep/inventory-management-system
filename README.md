# StockFlow — Inventory & Stock Management System

A full-stack MERN web app to manage products, stock levels, purchase orders and sales, with role-based access, real-time alerts and a reporting dashboard.

## Features

- Role-based login (admin, manager, staff) with JWT
- Product, category and supplier management
- Stock in / out / adjust with a full movement history (transactional, concurrency-safe)
- Purchase orders and sales billing
- Low-stock alerts with real-time notifications (Socket.IO)
- Dashboard with sales, expense and stock reports
- CSV export on every list page

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Recharts, React Router, Socket.IO client |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| Deployment | Vercel (client), Render (server) |

## Getting Started

### Prerequisites
- Node.js (LTS), Git, a free MongoDB Atlas cluster

### 1. Clone
```bash
git clone https://github.com/rajdeep-mondal7/inventory-management-system.git
cd inventory-management-system
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env   # on Windows: copy .env.example .env
# fill in MONGO_URI and JWT_SECRET in .env
# JWT_SECRET: use a long random string, e.g. `openssl rand -hex 32`
npm run dev
```

Optional demo data (never run against a real deployment):
```bash
npm run seed        # demo users + ~120 days of sales, expenses and stock history
npm test            # needs TEST_MONGO_URI pointing at a database whose name contains "test"
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173

## Project Structure

```
inventory-management-system/
├── client/     React app
├── server/     Express API (models, routes, controllers, services)
├── docs/       Diagrams and API notes
└── README.md
```

## Team

Ownership is tracked in [project-context/tasks.md](project-context/tasks.md) and the `// OWNER:` comments in the code.

## Roadmap

- [x] Project setup and shared models
- [x] Authentication and roles
- [x] Products, categories and suppliers
- [x] Stock operations
- [x] Purchase orders and sales
- [x] Dashboard and reports
- [x] Alerts (real-time) 
- [ ] Deployment (Vercel + Render)
- [ ] UI design consolidation (see docs/)

## License

MIT
