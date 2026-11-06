# Inventory & Stock Management System

A full-stack MERN web app to manage products, stock levels, purchase orders and sales, with role-based access and a live dashboard.

> Status: in development

## Features

- Role-based login (admin, manager, staff) with JWT
- Product, category and supplier management
- Stock in / out / adjust with a full movement history
- Purchase orders and sales billing
- Low-stock alerts and notifications
- Dashboard with sales, purchase and expense charts
- Report export (Excel / PDF)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| Deployment | Vercel (client), Render (server) |

## Screenshots

_Add screenshots or a demo GIF here once the dashboard is ready._

## Getting Started

### Prerequisites
- Node.js (LTS), Git, a free MongoDB Atlas cluster

### 1. Clone
```bash
git clone https://github.com/<owner>/inventory-management-system.git
cd inventory-management-system
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env   # on Windows: copy .env.example .env
# fill in MONGO_URI and JWT_SECRET in .env
npm run dev
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

| Member | Module |
|---|---|
| _name_ (Leader) | Auth, app shell, alerts, deployment |
| _name_ | Products, categories, suppliers |
| _name_ | Stock operations, purchase orders |
| _name_ | Sales, dashboard, expenses |

## Roadmap

- [ ] Project setup and shared models
- [ ] Authentication and roles
- [ ] Products and suppliers
- [ ] Stock operations
- [ ] Purchase orders and sales
- [ ] Dashboard and reports
- [ ] Alerts and deployment

## License

MIT
