import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { globalState } from './state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/state', (req, res) => {
    res.json(globalState.getState());
});

export function startDashboard() {
    app.listen(PORT, () => {
        const publicUrl = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : `http://localhost:${PORT}`;
        globalState.addLog('system', `Dashboard active. Access at: ${publicUrl}`);
    });
}
