from ninja import Router
from .schemas import TransactionSchema
from django.shortcuts import get_object_or_404
from users.models import User
from rolepermissions.checkers import has_permission
from django.db import transaction as django_transaction
from .models import Transactions
from .tasks import send_notification

payments_router = Router()

@payments_router.post("/", response={200: dict, 400: dict, 403: dict})
def transaction(request, transaction: TransactionSchema):
    payer = get_object_or_404(User, id=transaction.payer)
    payee = get_object_or_404(User, id=transaction.payee)

    if payer.amount < transaction.amount:
        return 400, {"error": "Saldo insuficiente para realizar a transação."}

    if not has_permission(payer, 'make_transaction'):
        return 403, {"error": "O usuário não tem permissão para realizar transações."}

    if not has_permission(payee, 'receive_transaction'):
        return 403, {"error": "O usuário não tem permissão para receber transações."}

    with django_transaction.atomic():
        payer.pay(transaction.amount)
        payee.receive(transaction.amount)

        transct = Transactions(
            amount=transaction.amount,
            payer_id=transaction.payer,
            payee_id=transaction.payee
        )
        payer.save()
        payee.save()
        transct.save()

    try:
        send_notification.delay(
            payer.first_name,
            payee.first_name,
            transaction.amount,
        )
    except Exception:
        pass

    return 200, {'transaction_id': transct.id, 'message': 'Transação realizada com sucesso.'}