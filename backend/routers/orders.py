from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


def _build_order_response(order: models.Order) -> schemas.OrderResponse:
    """Convert an ORM Order object to an OrderResponse schema."""
    items = []
    for item in order.items:
        items.append(schemas.OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else None,
        ))
    return schemas.OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        created_at=order.created_at,
        customer=schemas.CustomerResponse(
            id=order.customer.id,
            full_name=order.customer.full_name,
            email=order.customer.email,
            phone_number=order.customer.phone_number,
            created_at=order.customer.created_at,
        ) if order.customer else None,
        items=items,
    )


@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with id {order_data.customer_id} not found."
        )

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )

    # Validate all products and stock BEFORE any mutations
    resolved_items = []
    for item_data in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with id {item_data.product_id} not found."
            )
        if product.quantity_in_stock < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product: {product.name}. "
                       f"Available: {product.quantity_in_stock}, Requested: {item_data.quantity}."
            )
        resolved_items.append((product, item_data.quantity))

    # All validations passed — create order
    total_amount = sum(product.price * qty for product, qty in resolved_items)

    db_order = models.Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount,
    )
    db.add(db_order)
    db.flush()  # get db_order.id without committing

    # Create order items and deduct stock
    for product, quantity in resolved_items:
        order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
        )
        db.add(order_item)
        product.quantity_in_stock -= quantity

    db.commit()

    # Reload with all relations
    db.refresh(db_order)
    db_order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == db_order.id)
        .first()
    )
    return _build_order_response(db_order)


@router.get("", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .order_by(models.Order.id)
        .all()
    )
    return [_build_order_response(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found."
        )
    return _build_order_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found."
        )

    # Restore stock for each item
    for item in order.items:
        if item.product:
            item.product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
    return None
