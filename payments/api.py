from ninja import Router
from .schemas import TransactionSchema

payments_router = Router()

@payments_router.post("/")
def transaction(request, transaction: TransactionSchema):
    print(transaction.dict())
    # Lógica para processar a transação
    return {"message": "Transação processada com sucesso."}