from django.core.exceptions import ValidationError

def validate_cpf(value):

    # remover pontuação 
    cpf = ''.join([char for char in value if char.isdigit()])

    # verificar se o CPF tem 11 dígitos
    if len(cpf) != 11:
        print("CPF deve ter 11 dígitos")
        raise ValidationError("CPF deve ter 11 dígitos")

    # verificar se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        print("CPF inválido")
        raise ValidationError("CPF inválido")

    # função para calcular o dígito verificador
    def calcular_digito(cpf, multiplicadores):
        soma = sum(
            int(cpf[i]) * multiplicadores[i]
            for i in range(len(multiplicadores))
        )
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)

    # multiplicadores para o primeiro dígito verificador
    multiplicadores_primeiro = list(range(10, 1, -1))
    primeiro_digito = calcular_digito(cpf, multiplicadores_primeiro)

    # multiplicadores para o segundo dígito verificador
    multiplicadores_segundo = list(range(11, 1, -1))
    segundo_digito = calcular_digito(cpf + primeiro_digito, multiplicadores_segundo)

    # verificar se os dígitos calculados são iguais ao informados
    if not (cpf[-2] == str(primeiro_digito) and cpf[-1] == str(segundo_digito)):
        print("CPF inválido")
        raise ValidationError("CPF inválido")