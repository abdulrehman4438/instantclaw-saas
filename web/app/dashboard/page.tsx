'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Bot, Power, RotateCcw, Trash2, Plus, LogOut,
    CheckCircle, XCircle, Loader2, Clock, Zap,
    MessageCircle, Activity
} from 'lucide-react'

interface Agent {
    id: string
    name: string
    model: string
    channel: string
    status: string
    container_id: string
    port: number | null
    created_at: string
}

interface Profile {
    full_name: string
    plan: string
}

export default function DashboardPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth')
            return
        }

        // Load profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileData) setProfile(profileData)

        // Load agents
        const { data: agentsData } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (agentsData) setAgents(agentsData)
        setLoading(false)
    }

    const handleStop = async (agentId: string) => {
        setActionLoading(agentId)
        try {
            const res = await fetch('/api/agent/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId }),
            })
            if (res.ok) {
                setAgents(agents.map(a => a.id === agentId ? { ...a, status: 'stopped' } : a))
            }
        } catch (err) {
            console.error(err)
        }
        setActionLoading(null)
    }

    const handleRestart = async (agentId: string) => {
        setActionLoading(agentId)
        try {
            const res = await fetch('/api/agent/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId }),
            })
            if (res.ok) {
                setAgents(agents.map(a => a.id === agentId ? { ...a, status: 'running' } : a))
            }
        } catch (err) {
            console.error(err)
        }
        setActionLoading(null)
    }

    const handleDestroy = async (agentId: string) => {
        if (!confirm('Are you sure you want to permanently delete this agent?')) return
        setActionLoading(agentId)
        try {
            const agent = agents.find(a => a.id === agentId)
            if (!agent) return

            // Call orchestrator to destroy container
            const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || '/api/agent/destroy'
            await fetch('/api/agent/destroy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId }),
            })

            // Remove from Supabase
            await supabase.from('agents').delete().eq('id', agentId)
            setAgents(agents.filter(a => a.id !== agentId))
        } catch (err) {
            console.error(err)
        }
        setActionLoading(null)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'running':
                return { color: '#34D399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Running', icon: CheckCircle }
            case 'stopped':
                return { color: '#F87171', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Stopped', icon: XCircle }
            case 'deploying':
                return { color: '#FBBF24', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Deploying', icon: Loader2 }
            case 'error':
                return { color: '#F87171', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Error', icon: XCircle }
            default:
                return { color: '#9CA3AF', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Pending', icon: Clock }
        }
    }

    const getModelLabel = (model: string) => {
        switch (model) {
            case 'gemini-flash': return 'Gemini Flash'
            case 'gpt-4o': return 'GPT-4o'
            case 'claude-sonnet': return 'Claude Sonnet'
            case 'deepseek': return 'DeepSeek'
            default: return model
        }
    }

    const getPlanBadge = (plan: string) => {
        switch (plan) {
            case 'starter': return { label: 'Starter', color: '#34D399' }
            case 'pro': return { label: 'Pro', color: '#FF4F00' }
            case 'business': return { label: 'Business', color: '#818CF8' }
            default: return { label: 'Free', color: '#9CA3AF' }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030014] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#FF4F00] animate-spin" />
            </div>
        )
    }

    const planBadge = getPlanBadge(profile?.plan || '')

    return (
        <div className="min-h-screen bg-[#030014] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#FF4F00]/4 rounded-full blur-[150px]" />
            </div>

            {/* Top Nav */}
            <nav className="relative border-b border-white/[0.06] px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/" className="flex items-center gap-2 text-lg font-bold">
                            <span className="text-xl">🦞</span>
                            <span>InstantClaw</span>
                        </a>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${planBadge.color}20`, color: planBadge.color }}>
                            {planBadge.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{profile?.full_name || 'User'}</span>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Your Agents</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your deployed AI agents</p>
                    </div>
                    <button
                        onClick={() => router.push('/onboarding')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF4F00] hover:bg-[#E64500] text-white text-sm font-semibold transition-all shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Agent
                    </button>
                </div>

                {/* Agents List */}
                {agents.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                        <Bot className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">No agents yet</h3>
                        <p className="text-sm text-gray-600 mb-6">Deploy your first AI agent in under a minute.</p>
                        <button
                            onClick={() => router.push('/onboarding')}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF4F00] hover:bg-[#E64500] text-white text-sm font-semibold transition-all shadow-lg shadow-orange-500/20"
                        >
                            <Zap className="w-4 h-4" />
                            Deploy First Agent
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {agents.map((agent) => {
                            const status = getStatusConfig(agent.status)
                            const StatusIcon = status.icon
                            const isThisLoading = actionLoading === agent.id

                            return (
                                <div
                                    key={agent.id}
                                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:bg-white/[0.03] transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        {/* Agent Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#FF4F00]/10 flex items-center justify-center">
                                                <Bot className="w-6 h-6 text-[#FF4F00]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold">{agent.name}</h3>
                                                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${status.bg} ${status.border} border`} style={{ color: status.color }}>
                                                        <StatusIcon className={`w-3 h-3 ${agent.status === 'deploying' ? 'animate-spin' : ''}`} />
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                    <span className="flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        {getModelLabel(agent.model)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="w-3 h-3" />
                                                        {agent.channel}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(agent.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {agent.status === 'running' ? (
                                                <button
                                                    onClick={() => handleStop(agent.id)}
                                                    disabled={isThisLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                                                >
                                                    {isThisLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                                                    Stop
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRestart(agent.id)}
                                                    disabled={isThisLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all disabled:opacity-50"
                                                >
                                                    {isThisLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                                    Restart
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDestroy(agent.id)}
                                                disabled={isThisLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-gray-500 hover:bg-red-500/10 hover:text-red-400 border border-white/[0.08] transition-all disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
