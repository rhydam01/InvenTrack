# InvenTrack — Inventory & Order Management System

A full-stack, production-ready, fully containerized Inventory & Order Management System built with **FastAPI**, **React**, and **PostgreSQL**, orchestrated with **Docker Compose**.

---

## 📦 Tech Stack

| Layer         | Technology                  |
|---------------|-----------------------------|
| **Backend**   | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic |
| **Frontend**  | React 18, Vite, React Router v6, Axios, react-hot-toast |
| **Database**  | PostgreSQL 15               |
| **Containerization** | Docker, Docker Compose |
| **Web Server**| Nginx (serves built React app) |

---

## 🚀 Run Locally (Single Command)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Git](https://git-scm.com/)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd inventory-management

# 2. Copy environment variables
cp .env.example .env

# 3. Build and start all services
docker-compose up --build
```

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

To stop:
```bash
docker-compose down
```

To stop and remove all data (volumes):
```bash
docker-compose down -v
```

---

## 🔧 Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

| Variable           | Description                                        | Example                                              |
|--------------------|----------------------------------------------------|------------------------------------------------------|
| `POSTGRES_USER`    | PostgreSQL username                                | `admin`                                              |
| `POSTGRES_PASSWORD`| PostgreSQL password                                | `securepassword123`                                  |
| `POSTGRES_DB`      | PostgreSQL database name                           | `inventory_db`                                       |
| `DATABASE_URL`     | Full connection string for the backend             | `postgresql://admin:securepassword123@db:5432/inventory_db` |
| `VITE_API_URL`     | Backend API base URL (used by frontend build)      | `http://localhost:8000` (dev) or Render URL (prod)   |

---

## 📡 API Endpoints

### Health
| Method | URL       | Description          |
|--------|-----------|----------------------|
| GET    | `/`       | API status check     |
| GET    | `/health` | Health check         |

### Dashboard
| Method | URL          | Response                                          |
|--------|--------------|---------------------------------------------------|
| GET    | `/dashboard` | `{ total_products, total_customers, total_orders, low_stock_products }` |

---

### Products `/products`
| Method | URL               | Request Body                                    | Response            |
|--------|-------------------|-------------------------------------------------|---------------------|
| POST   | `/products`       | `{ name, sku, price, quantity_in_stock }`       | 201 + product object |
| GET    | `/products`       | —                                               | Array of products   |
| GET    | `/products/{id}`  | —                                               | Single product / 404|
| PUT    | `/products/{id}`  | `{ name, sku, price, quantity_in_stock }`       | Updated product     |
| DELETE | `/products/{id}`  | —                                               | 204 No Content      |

**Validation rules:**
- `sku` must be unique — returns `400` if duplicate
- `quantity_in_stock` cannot be negative
- `price` must be positive

---

### Customers `/customers`
| Method | URL                 | Request Body                             | Response              |
|--------|---------------------|------------------------------------------|-----------------------|
| POST   | `/customers`        | `{ full_name, email, phone_number }`     | 201 + customer object |
| GET    | `/customers`        | —                                        | Array of customers    |
| GET    | `/customers/{id}`   | —                                        | Single customer / 404 |
| DELETE | `/customers/{id}`   | —                                        | 204 No Content        |

**Validation rules:**
- `email` must be unique — returns `400` if duplicate
- `email` must be a valid email format (validated by Pydantic `EmailStr`)

---

### Orders `/orders`
| Method | URL              | Request Body                                                        | Response              |
|--------|------------------|---------------------------------------------------------------------|-----------------------|
| POST   | `/orders`        | `{ customer_id, items: [{ product_id, quantity }, ...] }`           | 201 + full order      |
| GET    | `/orders`        | —                                                                   | Array of orders       |
| GET    | `/orders/{id}`   | —                                                                   | Full order details / 404 |
| DELETE | `/orders/{id}`   | —                                                                   | 204 — stock restored  |

**Business rules enforced by backend:**
1. `customer_id` must exist
2. Every `product_id` must exist
3. All items must have sufficient stock — if ANY product is under-stocked, **entire order is rejected** with `400`
4. On success, stock is automatically reduced for each product
5. On DELETE, stock is automatically **restored** for each item
6. `total_amount` is always calculated server-side (`unit_price × quantity`, summed)
7. `unit_price` is a snapshot of the product price at order time

---

## 🐳 Docker Architecture

```
docker-compose.yml
├── db (postgres:15-alpine)
│   └── Named volume: postgres_data
├── backend (FastAPI on :8000)
│   └── depends_on: db (with healthcheck)
└── frontend (nginx serving React build on :3000→:80)
    └── depends_on: backend
```

---

## ☁️ Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
6. Add environment variable:
   - `DATABASE_URL` → your Render PostgreSQL internal connection string
7. (Optional) use the included `render.yaml` for Infrastructure-as-Code deployment

### Frontend → Vercel

1. Import the repository on [Vercel](https://vercel.com)
2. Set **Framework Preset** to `Vite`
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_API_URL` → your live Render backend URL (e.g., `https://your-app.onrender.com`)
5. Deploy

---

## 🔗 Live URLs

| Service  | URL                                        |
|----------|--------------------------------------------|
| Frontend | [Frontend URL]                             |
| Backend  | [Backend URL]                              |
| API Docs | [Backend URL]/docs                         |
| Docker Hub | [Docker Hub image link]                  |

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── main.py           # FastAPI app, CORS, dashboard endpoint
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── database.py       # DB engine, session, Base
│   ├── routers/
│   │   ├── products.py   # CRUD + validation
│   │   ├── customers.py  # CRUD + email uniqueness
│   │   └── orders.py     # Order creation with stock logic
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── Orders.jsx
│   │   ├── services/
│   │   │   └── api.js    # Centralized Axios service
│   │   ├── App.jsx       # Router + Sidebar layout
│   │   ├── main.jsx      # React entry point
│   │   └── index.css     # Design system (dark mode)
│   ├── nginx.conf        # SPA routing for React Router
│   ├── vite.config.js
│   ├── Dockerfile        # Multi-stage build
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛡️ Error Handling

All error responses return JSON:
```json
{ "detail": "error message here" }
```

| Code | Meaning                                           |
|------|---------------------------------------------------|
| 400  | Duplicate SKU/email, insufficient stock, invalid customer |
| 404  | Resource not found                                |
| 422  | Malformed request body (handled by FastAPI/Pydantic) |
| 500  | Unexpected server error                           |

---

## 🧑‍💻 Development (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Set DATABASE_URL to your local PostgreSQL
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Set VITE_API_URL=http://localhost:8000 in frontend/.env
npm run dev
```
