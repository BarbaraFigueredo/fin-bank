#!/bin/bash
# Deploy enxuto do Fin Bank na Azure: Azure Container Apps (plano Consumption,
# backend) + Static Web App (frontend). Sem Postgres/Redis — Celery em modo
# síncrono (ver .env.example).
#
# Usamos Container Apps em vez de App Service porque o plano Consumption não
# depende da cota regional de vCPU (bloqueada por padrão em contas trial).
#
# O SQLite fica num Azure Files share montado no Container App (via
# DB_PATH=/data/db.sqlite3), então os dados sobrevivem a restart/redeploy e a
# scale-to-zero (plano Consumption com min-replicas 0). max-replicas fica
# em 1 de propósito: SQLite sobre um share de rede não aguenta múltiplos
# writers concorrentes.
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
for ns in Microsoft.ContainerRegistry Microsoft.Web Microsoft.App Microsoft.OperationalInsights Microsoft.Storage; do
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

echo "== Storage Account e File Share (persistência do SQLite) =="
STORAGE_ACCOUNT_NAME="stpicpay${SUFFIX}"
FILE_SHARE_NAME="picpay-db-share"
CONTAINERAPP_STORAGE_NAME="picpay-db-storage"

az storage account create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$STORAGE_ACCOUNT_NAME" \
  --location "$LOCATION" \
  --kind StorageV2 \
  --sku Standard_LRS \
  --output table

STORAGE_ACCOUNT_KEY=$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --query "[0].value" -o tsv)

az storage share-rm create \
  --resource-group "$RESOURCE_GROUP" \
  --storage-account "$STORAGE_ACCOUNT_NAME" \
  --name "$FILE_SHARE_NAME" \
  --quota 1 \
  --enabled-protocols SMB \
  --output table

az containerapp env storage set \
  --access-mode ReadWrite \
  --azure-file-account-name "$STORAGE_ACCOUNT_NAME" \
  --azure-file-account-key "$STORAGE_ACCOUNT_KEY" \
  --azure-file-share-name "$FILE_SHARE_NAME" \
  --storage-name "$CONTAINERAPP_STORAGE_NAME" \
  --name "$CONTAINERAPP_ENV" \
  --resource-group "$RESOURCE_GROUP" \
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
    DB_PATH=/data/db.sqlite3 \
  --output table

WEBAPP_HOSTNAME=$(az containerapp show --name "$CONTAINERAPP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv)
WEBAPP_URL="https://${WEBAPP_HOSTNAME}"

echo "== Montando o volume do Azure Files no Container App =="
# Volume mount exige YAML — não tem flag equivalente em `az containerapp
# update`. Seguimos o padrão da própria doc da Microsoft: exporta a config
# atual (já validada e completa), injeta volumes/volumeMounts nela, reaplica.
APP_YAML="$(dirname "$0")/.containerapp.generated.yaml"
az containerapp show \
  --name "$CONTAINERAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output yaml \
  --only-show-errors > "$APP_YAML"

# Usa o Python embutido no az cli: é o que garantidamente tem PyYAML
# instalado (o venv do projeto não tem essa dependência).
/opt/az/bin/python3 - "$APP_YAML" "$CONTAINERAPP_STORAGE_NAME" <<'PY'
import sys
import yaml

path, storage_name = sys.argv[1], sys.argv[2]
with open(path) as f:
    data = yaml.safe_load(f)

template = data["properties"]["template"]
template["volumes"] = [{
    "name": "db-storage",
    "storageName": storage_name,
    "storageType": "AzureFile",
}]
template["containers"][0]["volumeMounts"] = [{
    "volumeName": "db-storage",
    "mountPath": "/data",
}]

with open(path, "w") as f:
    yaml.safe_dump(data, f, sort_keys=False)
PY

az containerapp update \
  --name "$CONTAINERAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --yaml "$APP_YAML" \
  --output table

rm -f "$APP_YAML"

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
