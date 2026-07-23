#!/bin/bash
# Deploy enxuto do Fin Bank na Azure: Azure Container Apps (plano Consumption,
# backend) + Static Web App (frontend). Sem Postgres/Redis — Celery em modo
# síncrono (ver .env.example).
#
# Usamos Container Apps em vez de App Service porque o plano Consumption não
# depende da cota regional de vCPU (bloqueada por padrão em contas trial).
#
# ATENÇÃO: o SQLite fica dentro do container, sem disco persistente. A cada
# restart/redeploy os dados são perdidos. Pra manter dados de verdade, o
# passo seguinte seria montar um Azure Files share no Container App (não
# incluído aqui pra manter o deploy simples).
#
# Pré-requisitos:
#   - az cli instalado e autenticado (`az login`)
#   - docker instalado e rodando (a imagem é buildada localmente e enviada
#     via `docker push` pro ACR — contas trial costumam ter o ACR Tasks
#     bloqueado, então build na nuvem via `az acr build` não é confiável)
#   - node/npm instalados (para `npx @azure/static-web-apps-cli`)
#
# Uso: rode este script a partir da raiz do repositório.
#   bash deploy/azure-deploy.sh
#
# Tudo fica dentro de um único resource group, então pra desligar depois:
#   az group delete --name "$RESOURCE_GROUP" --yes --no-wait

set -euo pipefail

# ---- Configuração (ajuste se algum nome já estiver em uso) ----------------
# O sufixo é persistido em deploy/.suffix para que reruns reaproveitem os
# mesmos nomes de recurso em vez de criar um ACR/app novo a cada vez.
SUFFIX_FILE="$(dirname "$0")/.suffix"
if [ -n "${SUFFIX:-}" ]; then
  : # respeita SUFFIX passado explicitamente pelo ambiente
elif [ -f "$SUFFIX_FILE" ]; then
  SUFFIX=$(cat "$SUFFIX_FILE")
else
  SUFFIX=$RANDOM
fi
echo "$SUFFIX" > "$SUFFIX_FILE"

RESOURCE_GROUP="rg-picpay-simplificado"
LOCATION="eastus2"                      # precisa suportar Static Web Apps
ACR_NAME="acrpicpay${SUFFIX}"           # só letras/números, precisa ser único globalmente
CONTAINERAPP_ENV="cae-picpay-simplificado"
CONTAINERAPP_NAME="picpay-api"
STATIC_WEBAPP_NAME="picpay-web-${SUFFIX}"
IMAGE_NAME="picpay-backend"

echo "== Registrando resource providers (só faz algo na primeira vez) =="
for ns in Microsoft.ContainerRegistry Microsoft.Web Microsoft.App Microsoft.OperationalInsights; do
  state=$(az provider show --namespace "$ns" --query registrationState -o tsv)
  if [ "$state" != "Registered" ]; then
    az provider register --namespace "$ns"
    until [ "$(az provider show --namespace "$ns" --query registrationState -o tsv)" = "Registered" ]; do
      echo "Aguardando registro de $ns..."
      sleep 5
    done
  fi
done

echo "== Resource group =="
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table

echo "== Azure Container Registry =="
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output table

echo "== Build da imagem localmente e push pro ACR =="
# (contas novas/trial costumam ter o ACR Tasks bloqueado, então build local
# + push é o caminho mais confiável aqui)
az acr login --name "$ACR_NAME"
docker build -t "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest" .
docker push "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest"

echo "== Static Web App (frontend) =="
az extension add --name staticwebapp --upgrade --only-show-errors || true
az staticwebapp create \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Free \
  --output table

SWA_HOSTNAME=$(az staticwebapp show --name "$STATIC_WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)
SWA_URL="https://${SWA_HOSTNAME}"

echo "== Extensão containerapp do az cli =="
az extension add --name containerapp --upgrade --only-show-errors

echo "== Ambiente do Container Apps =="
az containerapp env create \
  --name "$CONTAINERAPP_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

echo "== Container App (backend) =="
ACR_USER=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")

az containerapp create \
  --name "$CONTAINERAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINERAPP_ENV" \
  --image "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest" \
  --target-port 8000 \
  --ingress external \
  --registry-server "${ACR_NAME}.azurecr.io" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --min-replicas 0 \
  --max-replicas 1 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    SECRET_KEY="$SECRET_KEY" \
    DEBUG=False \
    CORS_ALLOWED_ORIGINS="$SWA_URL" \
    CELERY_TASK_ALWAYS_EAGER=True \
  --output table

WEBAPP_HOSTNAME=$(az containerapp show --name "$CONTAINERAPP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv)
WEBAPP_URL="https://${WEBAPP_HOSTNAME}"

echo "== Ajustando ALLOWED_HOSTS agora que a URL do backend é conhecida =="
az containerapp update \
  --name "$CONTAINERAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars ALLOWED_HOSTS="$WEBAPP_HOSTNAME" \
  --output table

echo "== Build do frontend apontando para o backend =="
(
  cd frontend
  echo "VITE_API_URL=${WEBAPP_URL}/api" > .env.production
  npm ci
  npm run build
)

echo "== Deploy do frontend na Static Web App =="
SWA_TOKEN=$(az staticwebapp secrets list --name "$STATIC_WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)
npx --yes @azure/static-web-apps-cli deploy ./frontend/dist \
  --deployment-token "$SWA_TOKEN" \
  --env production

echo ""
echo "=========================================="
echo "Backend:  $WEBAPP_URL"
echo "Frontend: $SWA_URL"
echo "Resource group (pra desligar tudo depois):"
echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo "=========================================="
