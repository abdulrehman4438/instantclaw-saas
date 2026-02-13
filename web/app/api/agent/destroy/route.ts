import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/agent/destroy — Permanently delete an agent
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

        // Destroy the container
        if (agent.container_id) {
            try {
                await fetch(`${orchestratorUrl}/destroy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ containerId: agent.container_id }),
                })
            } catch (e) {
                // Container might already be gone, continue with DB cleanup
                console.warn('Container destroy failed (may already be removed):', e)
            }
        }

        // Delete from database
        await supabase.from('agents').delete().eq('id', agentId)

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
