from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.test import TestCase, RequestFactory

from rolepermissions.roles import assign_role

from .api import login, me, search_user
from .models import AuthToken, User
from .schemas import LoginSchema
from .validators import validate_cnpj, validate_cpf, validate_cpf_cnpj


class AuthTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username="fernanda",
            first_name="Fernanda",
            last_name="Queiroz",
            cpf_cnpj="11144477735",
            email="fernanda@example.com",
            amount=Decimal("100.00"),
        )
        self.user.password = make_password("Senha@123")
        self.user.save()
        assign_role(self.user, "people")

    def test_login_with_username_returns_token(self):
        payload = LoginSchema(login="fernanda", password="Senha@123")
        status_code, body = login(RequestFactory().post("/api/users/login/"), payload)

        self.assertEqual(status_code, 200)
        self.assertIn("token", body)
        self.assertTrue(AuthToken.objects.filter(user=self.user).exists())

    def test_login_with_email_returns_token(self):
        payload = LoginSchema(login="fernanda@example.com", password="Senha@123")
        status_code, body = login(RequestFactory().post("/api/users/login/"), payload)

        self.assertEqual(status_code, 200)
        self.assertIn("token", body)

    def test_login_with_wrong_password_fails_with_generic_error(self):
        payload = LoginSchema(login="fernanda", password="errada")
        status_code, body = login(RequestFactory().post("/api/users/login/"), payload)

        self.assertEqual(status_code, 401)
        self.assertIn("error", body)

    def test_login_with_unknown_user_fails_with_same_generic_error(self):
        payload = LoginSchema(login="nao-existe", password="qualquer")
        status_code, body = login(RequestFactory().post("/api/users/login/"), payload)

        self.assertEqual(status_code, 401)
        self.assertIn("error", body)

    def test_me_returns_authenticated_user_profile(self):
        request = RequestFactory().get("/api/users/me/")
        request.auth = self.user
        result = me(request)

        self.assertEqual(result["id"], self.user.id)
        self.assertEqual(result["amount"], Decimal("100.00"))
        self.assertEqual(result["account_type"], "people")

    def test_search_finds_other_user_by_cpf(self):
        other = User.objects.create(
            username="miguel",
            first_name="Miguel",
            last_name="Santos",
            cpf_cnpj="52998224725",
            email="miguel@example.com",
        )
        request = RequestFactory().get("/api/users/search/")
        request.auth = self.user
        status_code, result = search_user(request, q="52998224725")

        self.assertEqual(status_code, 200)
        self.assertEqual(result.id, other.id)

    def test_search_does_not_return_self(self):
        request = RequestFactory().get("/api/users/search/")
        request.auth = self.user
        status_code, body = search_user(request, q=self.user.email)

        self.assertEqual(status_code, 404)

    def test_me_reports_company_account_type(self):
        company = User.objects.create(
            username="loja",
            first_name="Loja",
            last_name="Exemplo",
            cpf_cnpj="02898860412060",
            email="loja@example.com",
        )
        assign_role(company, "company")

        request = RequestFactory().get("/api/users/me/")
        request.auth = company
        result = me(request)

        self.assertEqual(result["account_type"], "company")
        self.assertEqual(result["cpf_cnpj"], "02898860412060")


class DocumentValidatorTests(TestCase):
    def test_validate_cpf_accepts_valid_cpf(self):
        validate_cpf("111.444.777-35")

    def test_validate_cnpj_accepts_valid_cnpj(self):
        validate_cnpj("02.898.860/4120-60")

    def test_validate_cnpj_rejects_repeated_digits(self):
        with self.assertRaises(ValidationError):
            validate_cnpj("11111111111111")

    def test_validate_cpf_cnpj_dispatches_by_length(self):
        validate_cpf_cnpj("111.444.777-35")
        validate_cpf_cnpj("02.898.860/4120-60")

    def test_validate_cpf_cnpj_rejects_wrong_length(self):
        with self.assertRaises(ValidationError):
            validate_cpf_cnpj("123456")
