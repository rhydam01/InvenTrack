from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models  # noqa: F401 — ensure models are registered before create_all
import schemas as s
from routers import products, customers, orders


# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System",
    description="A production-ready REST API for managing products, customers, and orders.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins for development/production flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


# ─────────────────────── Dashboard ───────────────────────

@app.get("/dashboard", response_model=s.DashboardResponse, tags=["Dashboard"])
def get_dashboard(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity_in_stock < 10)
        .order_by(models.Product.quantity_in_stock)
        .all()
    )
    return s.DashboardResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock,
    )


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Inventory & Order Management API is running."}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
