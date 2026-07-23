from ninja import ModelSchema, Schema
from .models import User

class UserSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'cpf', 'email', 'password']

class TypeSchema(Schema):
    type: str

class TypeUserSchema(Schema):
    user: UserSchema
    type_user: TypeSchema


class LoginSchema(Schema):
    login: str  # username ou e-mail
    password: str


class MeSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'cpf', 'email', 'amount']


class UserPublicSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name']
