# Fin Bank — frontend

Frontend em React + TypeScript + Vite + Tailwind para o backend Django em `../`.

## Rodando localmente

1. Backend (na raiz do projeto):

   ```bash
   source venv/bin/activate
   python manage.py migrate
   python manage.py runserver 8005
   ```

2. Frontend:

   ```bash
   cp .env.example .env   # ajuste VITE_API_URL se o backend não estiver em localhost:8005
   npm install
   npm run dev
   ```

   A aplicação sobe em `http://localhost:3000`.

## Autenticação

O login retorna um token Bearer (`POST /api/users/login/`) armazenado em `localStorage` e
enviado em todas as chamadas via `Authorization: Bearer <token>`. Um 401 do backend limpa a
sessão automaticamente (ver `src/api/client.ts`).

## Estrutura

- `src/api` — cliente HTTP (axios) e chamadas ao backend
- `src/context/AuthContext.tsx` — estado de sessão (usuário logado, login/logout)
- `src/routes/ProtectedRoute.tsx` — bloqueia rotas para quem não está autenticado
- `src/components/ui` — componentes base (Button, TextField, Card, Logo, ...)
- `src/pages` — telas (Login, Cadastro, Home, ...)
