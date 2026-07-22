from ninja import Router

payments_router = Router()

@payments_router.post("/")
def transaction(request):
    # Lógica para processar a transação
    return {"message": "Transação processada com sucesso."}