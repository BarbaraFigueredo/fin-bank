from ninja import ModelSchema
from .models import Transactions

class TransactionSchema(ModelSchema):
    class Meta:
        model = Transactions
        exclude = ['id', 'date']  # Exclui o campo 'id' e 'date' do schema