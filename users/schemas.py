from decimal import Decimal

from ninja import ModelSchema, Schema
from .models import User

class UserSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'cpf_cnpj', 'email', 'password']

class TypeSchema(Schema):
    type: str

class TypeUserSchema(Schema):
    user: UserSchema
    type_user: TypeSchema


class LoginSchema(Schema):
    login: str  # username ou e-mail
    password: str


class MeSchema(Schema):
    id: int
    username: str
    first_name: str
    last_name: str
    cpf_cnpj: str
    email: str
    amount: Decimal
    account_type: str  # "people" ou "company"


class UserPublicSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name']
