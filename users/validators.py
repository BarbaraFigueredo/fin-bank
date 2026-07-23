from django.core.exceptions import ValidationError


def _calcular_digito(base, multiplicadores):
    soma = sum(
        int(base[i]) * multiplicadores[i]
        for i in range(len(multiplicadores))
    )
    resto = soma % 11
    return '0' if resto < 2 else str(11 - resto)


def validate_cpf(value):
    # remover pontuação
    cpf = ''.join([char for char in value if char.isdigit()])

    # verificar se o CPF tem 11 dígitos
    if len(cpf) != 11:
        raise ValidationError("CPF deve ter 11 dígitos")

    # verificar se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        raise ValidationError("CPF inválido")

    # multiplicadores para o primeiro dígito verificador
    multiplicadores_primeiro = list(range(10, 1, -1))
    primeiro_digito = _calcular_digito(cpf, multiplicadores_primeiro)

    # multiplicadores para o segundo dígito verificador
    multiplicadores_segundo = list(range(11, 1, -1))
    segundo_digito = _calcular_digito(cpf + primeiro_digito, multiplicadores_segundo)

    # verificar se os dígitos calculados são iguais ao informados
    if not (cpf[-2] == str(primeiro_digito) and cpf[-1] == str(segundo_digito)):
        raise ValidationError("CPF inválido")


def validate_cnpj(value):
    # remover pontuação
    cnpj = ''.join([char for char in value if char.isdigit()])

    # verificar se o CNPJ tem 14 dígitos
    if len(cnpj) != 14:
        raise ValidationError("CNPJ deve ter 14 dígitos")

    # verificar se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        raise ValidationError("CNPJ inválido")

    # multiplicadores para o primeiro dígito verificador
    multiplicadores_primeiro = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    primeiro_digito = _calcular_digito(cnpj, multiplicadores_primeiro)

    # multiplicadores para o segundo dígito verificador
    multiplicadores_segundo = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    segundo_digito = _calcular_digito(cnpj + primeiro_digito, multiplicadores_segundo)

    # verificar se os dígitos calculados são iguais ao informados
    if not (cnpj[-2] == str(primeiro_digito) and cnpj[-1] == str(segundo_digito)):
        raise ValidationError("CNPJ inválido")


def validate_cpf_cnpj(value):
    """Aceita CPF (11 dígitos) ou CNPJ (14 dígitos), de acordo com o tamanho informado."""
    digits = ''.join([char for char in value if char.isdigit()])

    if len(digits) == 11:
        validate_cpf(value)
    elif len(digits) == 14:
        validate_cnpj(value)
    else:
        raise ValidationError("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.")