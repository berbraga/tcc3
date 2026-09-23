# Deploy do EduITSM no Firebase/Google Cloud

## Arquitetura

- Firebase Hosting serve `apps/web/dist`.
- Cloud Run executa a API Express usando o `Dockerfile`.
- Cloud SQL ou outro PostgreSQL gerenciado fornece `DATABASE_URL`.
- Secret Manager armazena `DATABASE_URL` e `JWT_SECRET`.

O Firebase Web SDK não substitui a autenticação JWT atual. A configuração web do Firebase pode ser pública; segredos nunca devem usar o prefixo `VITE_`.

## Preparação

Instale os CLIs uma vez, caso ainda não estejam disponíveis:

```bash
npm install --global firebase-tools
```

O projeto Firebase informado é `itsm-faculdade`. O faturamento ativo permite os serviços pagos, mas ainda é necessário autenticar o CLI e criar/configurar o banco PostgreSQL de produção.

```bash
firebase login
gcloud auth login
gcloud config set project itsm-faculdade
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com
```

Crie um PostgreSQL gerenciado e registre os segredos sem gravá-los no Git. O exemplo abaixo usa uma instância zonal de 1 vCPU/4 GB; confirme os custos no Billing antes da criação:

```bash
read -rsp 'Senha do usuário postgres: ' DB_ROOT_PASSWORD; echo
gcloud sql instances create eduitsm-prod \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --cpu=1 --memory=4GB \
  --region=southamerica-east1 \
  --root-password="$DB_ROOT_PASSWORD"
gcloud sql databases create eduitsm --instance=eduitsm-prod
read -rsp 'Senha do usuário da aplicação: ' DB_APP_PASSWORD; echo
gcloud sql users create eduitsm_app --instance=eduitsm-prod --password="$DB_APP_PASSWORD"
CONNECTION_NAME="itsm-faculdade:southamerica-east1:eduitsm-prod"
DATABASE_URL="postgresql://eduitsm_app:${DB_APP_PASSWORD}@localhost:5432/eduitsm?host=/cloudsql/${CONNECTION_NAME}&schema=public"
printf '%s' "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=-
openssl rand -base64 48 | gcloud secrets create JWT_SECRET --data-file=-
```

Conceda ao serviço do Cloud Run acesso ao banco e aos secrets:

```bash
PROJECT_NUMBER="$(gcloud projects describe itsm-faculdade --format='value(projectNumber)')"
RUN_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding itsm-faculdade \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT}" --role=roles/cloudsql.client
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT}" --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT}" --role=roles/secretmanager.secretAccessor
```

## API no Cloud Run

Crie o repositório de imagens uma única vez:

```bash
gcloud artifacts repositories create eduitsm \
  --repository-format=docker \
  --location=southamerica-east1 \
  --description='Imagens do EduITSM'
```

Se ele já existir, prossiga para o build.

```bash
gcloud builds submit --tag southamerica-east1-docker.pkg.dev/itsm-faculdade/eduitsm/api
gcloud run deploy eduitsm-api \
  --image southamerica-east1-docker.pkg.dev/itsm-faculdade/eduitsm/api \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars JWT_EXPIRES_IN=1h,WEB_ORIGIN=https://itsm-faculdade.web.app \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
```

O Cloud Run fornece `PORT`; a API o prioriza automaticamente. O container executa `prisma migrate deploy` antes de iniciar. Faça backup e use um banco de produção separado do banco local/teste.

## SPA no Firebase Hosting

Substitua a URL abaixo pela URL exibida pelo deploy do Cloud Run:

```bash
VITE_API_URL='https://eduitsm-api-EXEMPLO.run.app/api/v1' npm run build
firebase use itsm-faculdade
firebase deploy --only hosting
```

Depois confirme no Cloud Run:

```bash
curl -i 'https://eduitsm-api-EXEMPLO.run.app/api/v1/health'
```

## Configuração do navegador

O `WEB_ORIGIN` precisa ser exatamente a origem do Hosting. Se usar domínio próprio, atualize `WEB_ORIGIN` para esse domínio e faça novo deploy da API.

O seed de demonstração não deve ser executado automaticamente no banco de produção. Crie contas de demonstração somente se essa carga fizer parte do ambiente de aula.

## Deploy automático pelo GitHub Actions

`.github/workflows/deploy.yml` executa lint, typecheck, testes com PostgreSQL descartável e build em todo push para `main`. Depois publica a API no Cloud Run, verifica `/api/v1/health` e publica `apps/web/dist` no Firebase Hosting.

Configure no repositório GitHub os secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: recurso do provedor OIDC do GitHub;
- `GCP_SERVICE_ACCOUNT`: conta de serviço de deploy no Google Cloud;
- `FIREBASE_SERVICE_ACCOUNT`: JSON da conta de serviço autorizada no Firebase Hosting.

O provedor OIDC deve confiar somente no repositório e na branch `main`. A conta de deploy precisa de permissões para Cloud Build, Artifact Registry, Cloud Run e `iam.serviceAccountUser`; a conta de runtime do Cloud Run já recebe `roles/cloudsql.client` e `roles/secretmanager.secretAccessor` nos comandos acima. O workflow não contém senhas, tokens JWT ou `DATABASE_URL`.

Para criar o provedor OIDC e a conta de deploy, execute uma vez no Google Cloud Shell ou no terminal autenticado:

```bash
PROJECT_NUMBER="$(gcloud projects describe itsm-faculdade --format='value(projectNumber)')"
gcloud iam service-accounts create github-deploy --project=itsm-faculdade
DEPLOY_SA="github-deploy@itsm-faculdade.iam.gserviceaccount.com"

for ROLE in roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/run.admin roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding itsm-faculdade \
    --member="serviceAccount:${DEPLOY_SA}" --role="$ROLE"
done

gcloud iam workload-identity-pools create github-pool \
  --project=itsm-faculdade --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=itsm-faculdade --location=global --workload-identity-pool=github-pool \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == 'berbraga/tcc3' && assertion.ref == 'refs/heads/main'"
POOL_ID="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --project=itsm-faculdade \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/berbraga/tcc3"
```

Cadastre no GitHub: `GCP_SERVICE_ACCOUNT` igual a `github-deploy@itsm-faculdade.iam.gserviceaccount.com` e `GCP_WORKLOAD_IDENTITY_PROVIDER` com o recurso retornado por:

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --project=itsm-faculdade --location=global --workload-identity-pool=github-pool \
  --format='value(name)'
```

Crie `FIREBASE_SERVICE_ACCOUNT` no GitHub com o JSON de uma conta de serviço autorizada no Firebase Hosting. Nunca faça commit desse JSON.
