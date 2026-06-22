from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


# ─────────────────────── Product ───────────────────────

class ProductBase(BaseModel):
    name: str
    sku: str
    price: float
    quantity_in_stock: int

    @field_validator("quantity_in_stock")
    @classmethod
    def quantity_must_not_be_negative(cls, v):
        if v < 0:
            raise ValueError("quantity_in_stock cannot be negative")
        return v

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────── Customer ───────────────────────

class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────── Order Item ───────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return v


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


# ─────────────────────── Order ───────────────────────

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# ─────────────────────── Dashboard ───────────────────────

class DashboardResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]
