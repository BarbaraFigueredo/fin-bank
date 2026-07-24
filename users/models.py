import secrets

from django.contrib.auth.models import AbstractUser
from django.db import models
from decimal import Decimal
from .validators import validate_cpf_cnpj


class User(AbstractUser):
    cpf_cnpj = models.CharField(max_length=18, unique=True, validators=[validate_cpf_cnpj])
    email = models.EmailField(unique=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('500.00'))

    def save(self, *args, **kwargs):
        self.cpf_cnpj = self.cpf_cnpj.replace('.', '').replace('-', '').replace('/', '')
        super().save(*args, **kwargs)

    def pay(self, value: Decimal):
        if not isinstance(value, Decimal):
            raise ValueError("Value deve ser um decimal")

        self.amount -= value

    def receive(self, value: Decimal):
        if not isinstance(value, Decimal):
            raise ValueError("Value deve ser um decimal")

        self.amount += value


class AuthToken(models.Model):
    """Token de sessão emitido no login, usado como Bearer token pelo frontend."""

    key = models.CharField(max_length=64, unique=True, db_index=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_tokens")
    created = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = secrets.token_hex(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Token de {self.user.username}"
