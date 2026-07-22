from ninja import Router
from .schemas import TypeUserSchema
from .models import User
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from rolepermissions.roles import assign_role
users_router = Router()

users_router = Router()

@users_router.post("/", response={200: dict, 400: dict, 500: dict})
def create_user(request, type_user_schema: TypeUserSchema):
    print(type_user_schema.user.dict())
    print(type_user_schema.type_user.dict())
    user = User(**type_user_schema.user.dict())
    user.password = make_password(type_user_schema.user.password)
    try:
        user.full_clean()  # Valida os campos do modelo antes de salvar
        user.save()
        assign_role(user, type_user_schema.type_user.type)  # Atribui a role 'user' ao novo usuário
    except ValidationError as e:  
        return 400, {"error": e.message_dict}  # Retorna os erros de validação
    except Exception as e:
        return 500, {'errors': "Erro interno do servidor, contate o suporte."}
    return {'user_id': user.id, 'message': 'Usuário criado com sucesso.'}