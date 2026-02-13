import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse request body
        const { model, channel, telegramToken, apiKey, agentName } = await request.json()

        if (!model || !telegramToken) {
            return NextResponse.json({ error: 'Missing required fields: model, telegramToken' }, { status: 400 })
        }

        // 3. Get user's plan from profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single()

        const plan = profile?.plan || 'starter'

        // 4. Build environment variables for the OpenClaw container
        const env: Record<string, string> = {
            TELEGRAM_BOT_TOKEN: telegramToken,
        }

        // Model → provider mapping
        const modelProviderMap: Record<string, { provider: string; envKey: string }> = {
            'gemini-flash': { provider: 'google', envKey: 'GOOGLE_API_KEY' },
            'gpt-4o': { provider: 'openai', envKey: 'OPENAI_API_KEY' },
            'claude-sonnet': { provider: 'anthropic', envKey: 'ANTHROPIC_API_KEY' },
            'deepseek': { provider: 'deepseek', envKey: 'DEEPSEEK_API_KEY' },
        }

        const modelConfig = modelProviderMap[model]
        if (modelConfig) {
            env.AI_PROVIDER = modelConfig.provider
            env.AI_MODEL = model

            if (plan === 'starter' && apiKey) {
                // BYOK: user provides their own key
                env[modelConfig.envKey] = apiKey
            } else {
                // Pro/Business: use platform keys (stored in server env)
                const platformKey = process.env[`PLATFORM_${modelConfig.envKey}`]
                if (platformKey) {
                    env[modelConfig.envKey] = platformKey
                }
            }
        }

        // 5. Call the orchestrator to deploy the container
        const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:3001'

        const deployRes = await fetch(`${orchestratorUrl}/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                agentName: (agentName || 'my-agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
                env,
            }),
        })

        const deployData = await deployRes.json()

        if (!deployRes.ok) {
            throw new Error(deployData.error || 'Orchestrator deployment failed')
        }

        // 6. Save agent record to database
        const { data: agent, error: dbError } = await supabase
            .from('agents')
            .insert({
                user_id: user.id,
                name: agentName || 'My Agent',
                model,
                channel: channel || 'telegram',
                telegram_token: telegramToken,
                api_key: plan === 'starter' ? apiKey : null,
                container_id: deployData.containerId,
                status: 'running',
                port: parseInt(deployData.port) || null,
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Error saving agent:', dbError)
            // Container is running but DB failed — still return success
        }

        return NextResponse.json({
            success: true,
            agent: agent || {
                containerId: deployData.containerId,
                status: 'running',
                port: deployData.port,
            },
        })

    } catch (err: any) {
        console.error('Deploy API error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
