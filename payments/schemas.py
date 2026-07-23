from datetime import datetime
from decimal import Decimal

from ninja import ModelSchema, Schema
from .models import Transactions

class TransactionSchema(ModelSchema):
    class Meta:
        model = Transactions
        exclude = ['id', 'date']  # Exclui o campo 'id' e 'date' do schema


class TransactionCreateSchema(Schema):
    """O pagador é sempre o usuário autenticado (nunca vem do cliente)."""
    payee: int
    amount: Decimal


class TransactionOutSchema(Schema):
    id: int
    amount: Decimal
    date: datetime
    direction: str  # "in" ou "out", relativo ao usuário autenticado
    counterpart_name: str
    counterpart_id: int