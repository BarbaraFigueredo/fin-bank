from decimal import Decimal
from typing import List

from ninja import Router
from .schemas import TransactionCreateSchema, TransactionOutSchema
from django.db.models import Q
from django.shortcuts import get_object_or_404
from users.auth import TokenAuth
from users.models import User
from rolepermissions.checkers import has_permission
from django.db import transaction as django_transaction
from .models import Transactions
from .tasks import send_notification

payments_router = Router()

@payments_router.post("/", auth=TokenAuth(), response={200: dict, 400: dict, 403: dict, 404: dict})
def transaction(request, transaction: TransactionCreateSchema):
    # O pagador é sempre o usuário autenticado: nunca confiamos em um payer
    # vindo do corpo da requisição, senão qualquer um poderia debitar saldo alheio.
    payer = request.auth

    if transaction.amount <= Decimal("0"):
        return 400, {"error": "O valor da transação deve ser maior que zero."}

    if transaction.payee == payer.id:
        return 400, {"error": "Não é possível transferir para você mesmo."}

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
            payer_id=payer.id,
            payee_id=payee.id,
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


@payments_router.get("/", auth=TokenAuth(), response={200: List[TransactionOutSchema]})
def list_transactions(request):
    """Extrato do usuário autenticado: transações em que ele é pagador ou recebedor."""
    user = request.auth
    queryset = (
        Transactions.objects.filter(Q(payer=user) | Q(payee=user))
        .select_related("payer", "payee")
        .order_by("-date")
    )

    result = []
    for t in queryset:
        is_payer = t.payer_id == user.id
        counterpart = t.payee if is_payer else t.payer
        result.append(
            {
                "id": t.id,
                "amount": t.amount,
                "date": t.date,
                "direction": "out" if is_payer else "in",
                "counterpart_name": f"{counterpart.first_name} {counterpart.last_name}".strip(),
                "counterpart_id": counterpart.id,
            }
        )
    return result