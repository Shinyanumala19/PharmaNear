from datetime import datetime
import json
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')  # 'customer', 'pharmacy_owner', 'admin'
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    pharmacy = db.relationship('Pharmacy', backref='owner', uselist=False, lazy=True)
    orders = db.relationship('Order', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Pharmacy(db.Model):
    __tablename__ = 'pharmacies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    license_number = db.Column(db.String(50), nullable=True)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(80), default='Hyderabad')
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    open_hours = db.Column(db.String(100), default='8:00 AM - 11:00 PM')
    rating = db.Column(db.Float, default=4.6)
    is_approved = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inventory_items = db.relationship('Inventory', backref='pharmacy', lazy=True, cascade="all, delete-orphan")
    orders = db.relationship('Order', backref='pharmacy', lazy=True)

    def to_dict(self, lat=None, lng=None):
        data = {
            'id': self.id,
            'name': self.name,
            'owner_id': self.owner_id,
            'license_number': self.license_number,
            'address': self.address,
            'city': self.city,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'phone': self.phone,
            'open_hours': self.open_hours,
            'rating': self.rating,
            'is_approved': self.is_approved
        }
        return data


class Medicine(db.Model):
    __tablename__ = 'medicines'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    generic_name = db.Column(db.String(150), nullable=True)
    category = db.Column(db.String(80), nullable=False)
    dosage = db.Column(db.String(80), nullable=True)
    manufacturer = db.Column(db.String(120), nullable=True)
    prescription_required = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)

    inventory_entries = db.relationship('Inventory', backref='medicine', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'generic_name': self.generic_name,
            'category': self.category,
            'dosage': self.dosage,
            'manufacturer': self.manufacturer,
            'prescription_required': self.prescription_required,
            'description': self.description,
            'image_url': self.image_url
        }


class Inventory(db.Model):
    __tablename__ = 'inventories'

    id = db.Column(db.Integer, primary_key=True)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey('pharmacies.id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float, nullable=True)
    stock_quantity = db.Column(db.Integer, default=0, nullable=False)
    batch_number = db.Column(db.String(50), nullable=True)
    expiry_date = db.Column(db.String(20), nullable=True)  # YYYY-MM-DD
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'pharmacy_id': self.pharmacy_id,
            'pharmacy_name': self.pharmacy.name if self.pharmacy else '',
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine.name if self.medicine else '',
            'category': self.medicine.category if self.medicine else '',
            'dosage': self.medicine.dosage if self.medicine else '',
            'prescription_required': self.medicine.prescription_required if self.medicine else False,
            'price': self.price,
            'discount_price': self.discount_price,
            'stock_quantity': self.stock_quantity,
            'batch_number': self.batch_number,
            'expiry_date': self.expiry_date,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(32), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey('pharmacies.id'), nullable=False)
    order_type = db.Column(db.String(20), default='order')  # 'order' or 'reservation'
    status = db.Column(db.String(30), default='pending')  # 'pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'
    total_amount = db.Column(db.Float, default=0.0)
    prescription_image = db.Column(db.String(255), nullable=True)
    items_json = db.Column(db.Text, nullable=False)  # JSON string of items [{medicine_id, name, qty, price}]
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_items(self):
        try:
            return json.loads(self.items_json)
        except Exception:
            return []

    def set_items(self, items_list):
        self.items_json = json.dumps(items_list)

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'user_id': self.user_id,
            'customer_name': self.user.name if self.user else 'Customer',
            'customer_phone': self.user.phone if self.user else '',
            'customer_email': self.user.email if self.user else '',
            'pharmacy_id': self.pharmacy_id,
            'pharmacy_name': self.pharmacy.name if self.pharmacy else 'Pharmacy',
            'pharmacy_phone': self.pharmacy.phone if self.pharmacy else '',
            'order_type': self.order_type,
            'status': self.status,
            'total_amount': round(self.total_amount, 2),
            'prescription_image': self.prescription_image,
            'items': self.get_items(),
            'notes': self.notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None
        }
