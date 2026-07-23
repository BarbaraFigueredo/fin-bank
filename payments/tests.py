from decimal import Decimal
from django.test import TestCase, RequestFactory
from rolepermissions.roles import assign_role

from payments.api import transaction
from payments.schemas import TransactionSchema
from users.models import User


class PaymentsPermissionsTest(TestCase):
    def test_transaction_succeeds_when_payer_and_payee_have_matching_transfer_roles(self):
        payer = User.objects.create(
            username="payer",
            cpf="12345678909",
            email="payer@example.com",
            amount=Decimal("100.00"),
        )
        payee = User.objects.create(
            username="payee",
            cpf="98765432100",
            email="payee@example.com",
            amount=Decimal("0.00"),
        )

        assign_role(payer, "people")
        assign_role(payee, "people")

        payload = TransactionSchema(
            payer_id=payer.id,
            payee_id=payee.id,
            amount=Decimal("25.00"),
        )

        status_code, body = transaction(RequestFactory().post("/api/payments/"), payload)

        self.assertEqual(status_code, 200)
        self.assertEqual(body["message"], "Transação realizada com sucesso.")
        self.assertIn("transaction_id", body)
