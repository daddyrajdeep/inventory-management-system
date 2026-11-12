# StockFlow client

React 19 + Vite + Tailwind CSS v4. See the root README for full setup.

```bash
npm install
npm run dev      # http://localhost:5173 (expects the API on http://localhost:5000)
npm run lint
npm run build
```

The API address comes from `.env` (`VITE_API_URL`, see `.env.example`).
The Socket.IO connection for live alerts uses the same address without `/api`.
