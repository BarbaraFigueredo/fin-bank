from decimal import Decimal
from django.test import TestCase, RequestFactory
from rolepermissions.roles import assign_role

from payments.api import transaction
from payments.schemas import TransactionCreateSchema
from users.models import User


class PaymentsPermissionsTest(TestCase):
    def _make_request(self, auth_user):
        request = RequestFactory().post("/api/payments/")
        request.auth = auth_user
        return request

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

        payload = TransactionCreateSchema(payee=payee.id, amount=Decimal("25.00"))

        status_code, body = transaction(self._make_request(payer), payload)

        self.assertEqual(status_code, 200)
        self.assertEqual(body["message"], "Transação realizada com sucesso.")
        self.assertIn("transaction_id", body)

        payer.refresh_from_db()
        payee.refresh_from_db()
        self.assertEqual(payer.amount, Decimal("75.00"))
        self.assertEqual(payee.amount, Decimal("25.00"))

    def test_transaction_fails_with_insufficient_balance(self):
        payer = User.objects.create(
            username="payer2",
            cpf="11144477735",
            email="payer2@example.com",
            amount=Decimal("10.00"),
        )
        payee = User.objects.create(
            username="payee2",
            cpf="52998224725",
            email="payee2@example.com",
            amount=Decimal("0.00"),
        )
        assign_role(payer, "people")
        assign_role(payee, "people")

        payload = TransactionCreateSchema(payee=payee.id, amount=Decimal("50.00"))
        status_code, body = transaction(self._make_request(payer), payload)

        self.assertEqual(status_code, 400)
        self.assertIn("error", body)

    def test_transaction_cannot_transfer_to_self(self):
        payer = User.objects.create(
            username="payer3",
            cpf="71428793860",
            email="payer3@example.com",
            amount=Decimal("100.00"),
        )
        assign_role(payer, "people")

        payload = TransactionCreateSchema(payee=payer.id, amount=Decimal("10.00"))
        status_code, body = transaction(self._make_request(payer), payload)

        self.assertEqual(status_code, 400)
        self.assertIn("error", body)
