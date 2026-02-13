import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DockerService } from './services/dockerService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const dockerService = new DockerService();

app.use(cors());
app.use(express.json());

// --- Routes ---

/**
 * Health Check
 */
app.get('/', (req, res) => {
    res.send('InstantClaw Orchestrator is running! 爪');
});

/**
 * Deploy a new agent
 * POST /deploy
 * Body: { userId: string, agentName: string, env: { OPENCLAW_GATEWAY_TOKEN: string, ... } }
 */
app.post('/deploy', async (req, res) => {
    try {
        const { userId, agentName, env } = req.body;

        if (!userId || !agentName) {
            return res.status(400).json({ error: 'Missing userId or agentName' });
        }

        const result = await dockerService.deployAgent({
            userId,
            agentName,
            env: env || {}
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error('Deploy error:', error);
        res.status(500).json({ error: error.message || 'Failed to deploy agent' });
    }
});

/**
 * Stop an agent
 * POST /stop
 * Body: { containerId: string }
 */
app.post('/stop', async (req, res) => {
    try {
        const { containerId } = req.body;
        if (!containerId) return res.status(400).json({ error: 'Missing containerId' });

        const result = await dockerService.stopAgent(containerId);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Destroy an agent (remove container)
 * POST /destroy
 * Body: { containerId: string }
 */
app.post('/destroy', async (req, res) => {
    try {
        const { containerId } = req.body;
        if (!containerId) return res.status(400).json({ error: 'Missing containerId' });

        const result = await dockerService.destroyAgent(containerId);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * List all running agents
 * GET /agents
 */
app.get('/agents', async (req, res) => {
    try {
        const agents = await dockerService.listAgents();
        res.json({ agents });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`[server]: Orchestrator running at http://0.0.0.0:${port}`);
});
