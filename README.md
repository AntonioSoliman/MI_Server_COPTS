# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Run locally (frontend + backend + MongoDB)

1. Install dependencies for frontend and backend:

```
# frontend
npm install

# backend
cd backend
npm install
cd ..
```

2. Start a local MongoDB (recommended via Docker Compose):

```
docker-compose up -d
```

3. Create `backend/.env` from the example and set `MONGO_URI` if needed:

```
cp backend/.env.example backend/.env
# Edit backend/.env and adjust MONGO_URI if you don't use docker-compose
```

4. Start the backend:

```
cd backend
npm start
```

5. Start the frontend (root folder):

```
npm run dev
```

The frontend will talk to the backend at `http://localhost:3000/api` by default.

## Avvio semplificato (frontend + backend)

Puoi avviare sia frontend che backend con un singolo comando (usa `concurrently`):

```
npm run start:all
```

Questo esegue `vite` (frontend) e `node backend/server.js` (backend) in parallelo.

## Docker (opzionale)

Sono presenti Dockerfile per frontend e backend e un `docker-compose.yml` che contiene i servizi `mongo`, `backend` e `frontend`.

Per buildare ed avviare l'intero stack:

```
docker-compose up --build -d
```

Il servizio frontend sarà disponibile su `http://localhost:5173/` (proxy verso nginx container) e il backend su `http://localhost:3000/`.


