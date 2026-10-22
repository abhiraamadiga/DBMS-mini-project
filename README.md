# Smart Logistics & Shipment Management System

A production-grade web application for logistics companies, shipment coordinators, warehouse staff, delivery agents, and customers to manage goods moving from sender to receiver. Centralizes customers, shipments, packages, warehouses, vehicles, drivers, routes, and tracking events with real-time status.

## Tech Stack
- **Frontend & API**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **SQL Database**: MySQL 8 (raw parameterized SQL via `mysql2/promise`, 3NF schema, views & triggers)
- **NoSQL Database**: MongoDB (via `mongoose` for audit & activity logging)
- **Icons & UI**: Lucide React, Sonner (toasts), next-themes (dark/light mode)

## Quick Start

### 1. Prerequisites
- Node.js (v20+ recommended)
- MySQL 8.0 running locally or via Docker
- MongoDB 7.0 running locally or via Docker

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env.local
```
Update your credentials in `.env.local` if needed:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=changeme
MYSQL_DATABASE=smart_logistics
MONGODB_URI=mongodb://localhost:27017/smart_logistics
```

### 3. Optional: Run Databases with Docker
```bash
docker-compose up -d
```

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Scripts
- `npm run db:migrate`: Run MySQL migrations (schema, views, triggers)
- `npm run db:seed`: Seed realistic Indian logistics dataset
- `npm run db:reset`: Drop, re-migrate, and re-seed all tables and Mongo logs
