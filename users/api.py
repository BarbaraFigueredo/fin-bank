from ninja import Router
from .schemas import LoginSchema, MeSchema, TypeUserSchema, UserPublicSchema
from .models import AuthToken, User
from .auth import TokenAuth
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.db import transaction as django_transaction
from django.db.models import Q
from rolepermissions.roles import assign_role

users_router = Router()

VALID_USER_TYPES = {"people", "company"}

@users_router.post("/", response={200: dict, 400: dict, 500: dict})
def create_user(request, type_user_schema: TypeUserSchema):
    user_type = type_user_schema.type_user.type
    if user_type not in VALID_USER_TYPES:
        return 400, {"error": f"Tipo de usuário inválido: '{user_type}'. Valores aceitos: {sorted(VALID_USER_TYPES)}."}

    user = User(**type_user_schema.user.dict())
    user.password = make_password(type_user_schema.user.password)
    try:
        user.full_clean()  # Valida os campos do modelo antes de salvar
        with django_transaction.atomic():
            user.save()
            assign_role(user, user_type)  # Atribui a role ao novo usuário
    except ValidationError as e:
        return 400, {"error": e.message_dict}  # Retorna os erros de validação
    except Exception as e:
        return 500, {'errors': "Erro interno do servidor, contate o suporte."}
    return {'user_id': user.id, 'message': 'Usuário criado com sucesso.'}


@users_router.post("/login/", response={200: dict, 401: dict})
def login(request, credentials: LoginSchema):
    try:
        user = User.objects.get(Q(username=credentials.login) | Q(email__iexact=credentials.login))
    except User.DoesNotExist:
        return 401, {"error": "Usuário ou senha inválidos."}

    authenticated_user = authenticate(request, username=user.username, password=credentials.password)
    if authenticated_user is None:
        return 401, {"error": "Usuário ou senha inválidos."}

    token = AuthToken.objects.create(user=authenticated_user)
    return 200, {
        "token": token.key,
        "user": MeSchema.from_orm(authenticated_user).dict(),
    }


@users_router.post("/logout/", auth=TokenAuth(), response={200: dict})
def logout(request):
    request.auth_token.delete()
    return 200, {"message": "Logout realizado com sucesso."}


@users_router.get("/me/", auth=TokenAuth(), response={200: MeSchema})
def me(request):
    return request.auth


@users_router.get("/search/", auth=TokenAuth(), response={200: UserPublicSchema, 404: dict})
def search_user(request, q: str):
    """Busca um destinatário para transferência por CPF ou e-mail exatos."""
    cpf_digits = "".join(ch for ch in q if ch.isdigit())
    query = Q(email__iexact=q.strip())
    if cpf_digits:
        query |= Q(cpf=cpf_digits)

    user = User.objects.filter(query).exclude(id=request.auth.id).first()
    if user is None:
        return 404, {"error": "Usuário não encontrado."}
    return 200, user