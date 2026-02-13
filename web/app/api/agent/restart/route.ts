import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/agent/restart — Restart a stopped agent
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { agentId } = await request.json()

        const { data: agent } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .eq('user_id', user.id)
            .single()

        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

        const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:3001'

        // Re-deploy with the same config
        const env: Record<string, string> = {
            TELEGRAM_BOT_TOKEN: agent.telegram_token || '',
        }

        if (agent.api_key) {
            // BYOK
            const modelProviderMap: Record<string, string> = {
                'gemini-flash': 'GOOGLE_API_KEY',
                'gpt-4o': 'OPENAI_API_KEY',
                'claude-sonnet': 'ANTHROPIC_API_KEY',
                'deepseek': 'DEEPSEEK_API_KEY',
            }
            const envKey = modelProviderMap[agent.model]
            if (envKey) env[envKey] = agent.api_key
        }

        const res = await fetch(`${orchestratorUrl}/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                agentName: agent.name.toLowerCase().replace(/\s+/g, '-'),
                env,
            }),
        })

        const data = await res.json()

        if (res.ok) {
            await supabase
                .from('agents')
                .update({
                    status: 'running',
                    container_id: data.containerId,
                    port: parseInt(data.port) || null,
                })
                .eq('id', agentId)
        }

        return NextResponse.json({ success: true, status: 'running' })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
