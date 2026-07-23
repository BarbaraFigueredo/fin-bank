from ninja.security import HttpBearer

from .models import AuthToken


class TokenAuth(HttpBearer):
    """Autentica requisições via 'Authorization: Bearer <token>'.

    O token é emitido pelo endpoint de login e armazenado em AuthToken.
    Em caso de sucesso, request.auth recebe o User autenticado.
    """

    def authenticate(self, request, token):
        try:
            auth_token = AuthToken.objects.select_related("user").get(key=token)
        except AuthToken.DoesNotExist:
            return None

        if not auth_token.user.is_active:
            return None

        request.auth_token = auth_token
        return auth_token.user
