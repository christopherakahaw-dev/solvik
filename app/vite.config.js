import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Runs the api/*.js serverless functions inside the Vite dev server, so
// `npm run dev` gives a working full-stack app locally without needing the
// Vercel CLI. In production these files deploy as real serverless functions.
function apiDevMiddleware() {
  return {
    name: 'local-api-functions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        const url = new URL(req.url, 'http://localhost');
        const fnName = url.pathname.replace('/api/', '').split('/')[0];
        const modPath = `/api/${fnName}.js`;

        let mod;
        try {
          mod = await server.ssrLoadModule(modPath);
        } catch (err) {
          res.statusCode = 404;
          res.end(`No API function at ${modPath}: ${err.message}`);
          return;
        }

        req.query = Object.fromEntries(url.searchParams);
        if (req.method === 'POST' && String(req.headers['content-type'] || '').includes('application/json')) {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = Buffer.concat(chunks).toString('utf8');
            req.body = body ? JSON.parse(body) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }
        }
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (body) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        try {
          await mod.default(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Local API function crashed', detail: String(err) }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [react(), apiDevMiddleware()],
  };
})
