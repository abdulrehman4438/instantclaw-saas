import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/agent/stop — Stop a running agent
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { agentId } = await request.json()

        // Get agent from DB
        const { data: agent } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .eq('user_id', user.id)
            .single()

        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

        const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:3001'

        const res = await fetch(`${orchestratorUrl}/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ containerId: agent.container_id }),
        })

        if (res.ok) {
            await supabase
                .from('agents')
                .update({ status: 'stopped' })
                .eq('id', agentId)
        }

        return NextResponse.json({ success: true, status: 'stopped' })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
