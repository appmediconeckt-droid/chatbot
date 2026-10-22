# Humaeli frontend

React application built with Vite.

## Run

1. Run `npm ci` in this directory.
2. Configure `VITE_API_BASE_URL` with your backend URL.
3. Run `npm run dev` and open the URL printed by Vite.

For local development, `.env.development.local` can point to the local backend, for example `http://localhost:5006`. Use the backend's configured `PORT`. Development overrides take priority over `.env` and `.env.local`.

Production builds use the production environment configuration. Do not commit environment secrets.

## Maintained commands

- `npm run build`: create the production output in `dist/`.
- `npm run preview`: preview the production build.
- `npm run lint`: check source code.

Application code is in `src/`, public assets in `public/`, and regression tests in `test/`. The imported `setupAxios.js` configures authentication and token refresh.
