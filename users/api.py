from ninja import Router
from .schemas import UserSchema
from .models import User
users_router = Router()

users_router = Router()

@users_router.post("/", response={200: dict})
def create_user(request, user: UserSchema):
    user = User(**user.dict())

    return {'ok': 'ok'}