import Docker from 'dockerode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

interface DeployOptions {
    userId: string;
    agentName: string;
    env: Record<string, string>;
}

// Map our model IDs to OpenClaw model strings
const OPENCLAW_MODEL_MAP: Record<string, string> = {
    'gemini-flash': 'google/gemini-3-flash',
    'gpt-4o': 'openai/gpt-4o',
    'claude-sonnet': 'anthropic/claude-sonnet-4-20250514',
    'deepseek': 'deepseek/deepseek-chat',
};

// Map our env key names to OpenClaw env var names
const OPENCLAW_ENV_KEY_MAP: Record<string, string> = {
    'GOOGLE_API_KEY': 'GOOGLE_GENERATIVE_AI_API_KEY',
    'OPENAI_API_KEY': 'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY': 'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY': 'DEEPSEEK_API_KEY',
};

export class DockerService {
    /**
     * Deploys a new OpenClaw agent container for a user
     */
    async deployAgent(options: DeployOptions) {
        const { userId, agentName, env } = options;
        const containerName = `agent-${userId}-${agentName}`;
        const image = 'ghcr.io/openclaw/openclaw:latest';

        console.log(`[DockerService] Deploying ${containerName}...`);

        try {
            // 0. Ensure image exists locally
            const images = await docker.listImages();
            const imageExists = images.some(img => img.RepoTags?.includes(image));

            if (!imageExists) {
                console.log(`[DockerService] Pulling image ${image}... (this may take a minute)`);
                await new Promise((resolve, reject) => {
                    docker.pull(image, (err: any, stream: any) => {
                        if (err) return reject(err);
                        docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err: any, output: any) {
                            if (err) return reject(err);
                            resolve(output);
                        }
                        function onProgress(event: any) {
                            // Optional: log progress
                        }
                    });
                });
                console.log(`[DockerService] Image pulled successfully.`);
            }

            // 1. Check if container already exists and remove it if so
            const existingContainer = docker.getContainer(containerName);
            try {
                const inspect = await existingContainer.inspect();
                if (inspect) {
                    console.log(`[DockerService] Removing existing container ${containerName}`);
                    await existingContainer.remove({ force: true });
                }
            } catch (e: any) {
                if (e.statusCode !== 404) throw e;
            }

            // 2. Generate a random gateway token
            const gatewayToken = crypto.randomBytes(32).toString('hex');

            // 3. Build OpenClaw configuration JSON (using new config format)
            const modelId = env.AI_MODEL || 'gemini-flash';
            const openclawModel = OPENCLAW_MODEL_MAP[modelId] || 'google/gemini-3-flash';
            const telegramToken = env.TELEGRAM_BOT_TOKEN;

            const openclawConfig = {
                agents: {
                    defaults: {
                        model: {
                            primary: openclawModel,
                        },
                    },
                },
                gateway: {
                    mode: 'local',
                    bind: 'lan',
                    auth: {
                        token: gatewayToken,
                    },
                },
                channels: {
                    telegram: {
                        enabled: true,
                        botToken: telegramToken || '',
                        dmPolicy: 'open',
                        allowFrom: ['*'],
                        groupPolicy: 'allowlist',
                        streamMode: 'partial',
                    },
                },
                plugins: {
                    entries: {
                        telegram: {
                            enabled: true,
                        },
                    },
                },
                commands: {
                    native: 'auto',
                    nativeSkills: 'auto',
                },
            };

            // 4. Write config and startup script to a temp directory
            const configDir = path.join(os.tmpdir(), 'instantclaw', containerName);
            fs.mkdirSync(configDir, { recursive: true });

            const configPath = path.join(configDir, 'openclaw.json');
            fs.writeFileSync(configPath, JSON.stringify(openclawConfig, null, 2));

            // NEW: Create auth-profiles.json for API keys
            const authProfiles: Record<string, any> = {
                version: 1,
                profiles: {}
            };

            // Map env keys to auth profiles
            if (env.GOOGLE_API_KEY) {
                authProfiles.profiles["google:default"] = {
                    type: "api_key",
                    provider: "google",
                    key: env.GOOGLE_API_KEY
                };
            }
            if (env.OPENAI_API_KEY) {
                authProfiles.profiles["openai:default"] = {
                    type: "api_key",
                    provider: "openai",
                    key: env.OPENAI_API_KEY
                };
            }
            if (env.ANTHROPIC_API_KEY) {
                authProfiles.profiles["anthropic:default"] = {
                    type: "api_key",
                    provider: "anthropic",
                    key: env.ANTHROPIC_API_KEY
                };
            }
            if (env.DEEPSEEK_API_KEY) {
                authProfiles.profiles["deepseek:default"] = {
                    type: "api_key",
                    provider: "deepseek",
                    key: env.DEEPSEEK_API_KEY
                };
            }

            const authPath = path.join(configDir, 'auth-profiles.json');
            fs.writeFileSync(authPath, JSON.stringify(authProfiles, null, 2));

            // Create a startup script that fixes permissions, installs config, and starts OpenClaw
            const startupScript = `#!/bin/bash
set -e

# Fix permissions — Docker volume may be created as root
chown -R node:node /home/node/.openclaw 2>/dev/null || true

# Ensure .openclaw directories exist with correct ownership
su -s /bin/bash node -c "mkdir -p /home/node/.openclaw/workspace /home/node/.openclaw/agents"

# Copy the pre-built config (overwrite if exists from previous deploy)  
cp /tmp/openclaw-config/openclaw.json /home/node/.openclaw/openclaw.json
chown node:node /home/node/.openclaw/openclaw.json

# Copy auth profiles if present
# Copy auth profiles if present
if [ -f /tmp/openclaw-config/auth-profiles.json ]; then
    # 1. Global auth profile
    cp /tmp/openclaw-config/auth-profiles.json /home/node/.openclaw/auth-profiles.json
    chown node:node /home/node/.openclaw/auth-profiles.json
    
    # 2. Agent-specific auth profile (where the error log says it's looking)
    # We need to manually create this path because "doctor --fix" might not have run yet
    su -s /bin/bash node -c "mkdir -p /home/node/.openclaw/agents/main/agent"
    cp /tmp/openclaw-config/auth-profiles.json /home/node/.openclaw/agents/main/agent/auth-profiles.json
    chown node:node /home/node/.openclaw/agents/main/agent/auth-profiles.json
fi

echo "[InstantClaw] Config installed:"
cat /home/node/.openclaw/openclaw.json

# Run doctor --fix to apply channel/config changes
echo "[InstantClaw] Running openclaw doctor --fix..."
su -s /bin/bash node -c "cd /app && node openclaw.mjs doctor --fix" || true

# Start the gateway as the node user
echo "[InstantClaw] Starting OpenClaw gateway..."
exec su -s /bin/bash node -c "cd /app && node openclaw.mjs gateway"
`;
            const scriptPath = path.join(configDir, 'startup.sh');
            fs.writeFileSync(scriptPath, startupScript, { mode: 0o755 });

            console.log(`[DockerService] Config written to ${configPath}`);
            console.log(`[DockerService] Model: ${openclawModel}`);
            console.log(`[DockerService] Telegram enabled: ${!!telegramToken}`);

            // 5. Build environment variables for the container
            const Env: string[] = [
                `OPENCLAW_GATEWAY_TOKEN=${gatewayToken}`,
            ];

            // Map API keys to OpenClaw env var names
            for (const [ourKey, openclawKey] of Object.entries(OPENCLAW_ENV_KEY_MAP)) {
                if (env[ourKey]) {
                    Env.push(`${openclawKey}=${env[ourKey]}`);
                }
            }

            // Also pass TELEGRAM_BOT_TOKEN as env var
            if (telegramToken) {
                Env.push(`TELEGRAM_BOT_TOKEN=${telegramToken}`);
            }

            console.log(`[DockerService] Env vars: ${Env.map(e => e.split('=')[0]).join(', ')}`);

            // 6. Create Container with startup script (run as root for permission fix, script switches to node)
            const container = await docker.createContainer({
                Image: image,
                name: containerName,
                Env,
                Cmd: ['bash', '/tmp/openclaw-config/startup.sh'],
                User: 'root',
                HostConfig: {
                    PortBindings: {
                        '18789/tcp': [{ HostPort: '0' }]
                    },
                    RestartPolicy: {
                        Name: 'unless-stopped'
                    },
                    Binds: [
                        // Mount our config directory
                        `${configDir}:/tmp/openclaw-config:ro`,
                        // Persistent volume for agent data (sessions, workspace, etc.)
                        `openclaw-data-${userId}-${agentName}:/home/node/.openclaw`,
                    ]
                },
            });

            // 7. Start Container
            await container.start();

            // 8. Get assigned port
            const data = await container.inspect();
            const hostPort = data.NetworkSettings.Ports['18789/tcp']?.[0].HostPort;

            console.log(`[DockerService] Deployed ${containerName} on port ${hostPort}`);

            return {
                containerId: container.id,
                name: containerName,
                status: 'running',
                port: hostPort
            };

        } catch (error) {
            console.error('[DockerService] Deployment failed:', error);
            throw error;
        }
    }

    async stopAgent(containerId: string) {
        const container = docker.getContainer(containerId);
        await container.stop();
        return { status: 'stopped', id: containerId };
    }

    async destroyAgent(containerId: string) {
        const container = docker.getContainer(containerId);
        await container.remove({ force: true });
        return { status: 'destroyed', id: containerId };
    }

    async listAgents() {
        const containers = await docker.listContainers({ all: true });
        return containers
            .filter(c => c.Names.some(n => n.startsWith('/agent-')))
            .map(c => ({
                id: c.Id,
                names: c.Names,
                state: c.State,
                status: c.Status
            }));
    }
}
