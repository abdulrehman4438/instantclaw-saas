'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowRight, ArrowLeft, Rocket, CheckCircle, Loader2,
    Zap, Crown, Building2, Bot, MessageCircle, ExternalLink
} from 'lucide-react'

// ══════════════════════════════════════════
// PLANS DATA
// ══════════════════════════════════════════
const plans = [
    {
        id: 'starter',
        name: 'Starter',
        subtitle: 'Bring Your Own Keys',
        price: 15,
        features: [
            '1 always-on agent',
            'Telegram connection',
            'BYOK — your own API keys',
            'Auto-updates to latest OpenClaw',
            'Community support (Discord)',
        ],
        icon: Zap,
        color: '#34D399',
    },
    {
        id: 'pro',
        name: 'Pro',
        subtitle: 'Most Popular',
        price: 39,
        features: [
            'Everything in Starter',
            '$15/mo AI credits included',
            'Telegram + WhatsApp + Discord',
            'Install community skills',
            'Usage stats & agent logs',
            'Email support',
        ],
        icon: Crown,
        color: '#FF4F00',
        highlighted: true,
    },
    {
        id: 'business',
        name: 'Business',
        subtitle: 'For Power Users',
        price: 59,
        features: [
            'Everything in Pro',
            '$25/mo AI credits included',
            'All channels supported',
            'Install community skills',
            'Priority support (fast response)',
            'Early access to new features',
        ],
        icon: Building2,
        color: '#818CF8',
    },
]

// ══════════════════════════════════════════
// MODELS DATA
// ══════════════════════════════════════════
const models = [
    {
        id: 'gemini-flash',
        name: 'Gemini Flash',
        provider: 'Google',
        description: 'Fastest response times, great for everyday tasks',
        badge: 'Recommended',
        available: true,
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Balanced intelligence and speed',
        badge: null,
        available: true,
    },
    {
        id: 'claude-sonnet',
        name: 'Claude Sonnet',
        provider: 'Anthropic',
        description: 'Best for complex reasoning and writing',
        badge: 'Coming Soon',
        available: false,
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        provider: 'DeepSeek',
        description: 'Budget-friendly, good for simple tasks',
        badge: null,
        available: true,
    },
]

export default function OnboardingPage() {
    const [step, setStep] = useState(1)
    const [selectedPlan, setSelectedPlan] = useState<string>('pro')
    const [selectedModel, setSelectedModel] = useState<string>('gemini-flash')
    const [apiKey, setApiKey] = useState('')
    const [telegramToken, setTelegramToken] = useState('')
    const [agentName, setAgentName] = useState('My Agent')
    const [deploying, setDeploying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const currentPlan = plans.find(p => p.id === selectedPlan)
    const isByok = selectedPlan === 'starter'

    const handleDeploy = async () => {
        setDeploying(true)
        setError(null)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Update user's plan in profiles
            await supabase
                .from('profiles')
                .update({ plan: selectedPlan })
                .eq('id', user.id)

            // Call our deploy API
            const res = await fetch('/api/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    channel: 'telegram',
                    telegramToken,
                    apiKey: isByok ? apiKey : undefined,
                    agentName,
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Deployment failed')

            // Redirect to dashboard
            router.push('/dashboard?deployed=true')
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
            setDeploying(false)
        }
    }

    const canProceed = () => {
        if (step === 1) return !!selectedPlan
        if (step === 2) {
            if (isByok) return !!selectedModel && !!apiKey
            return !!selectedModel
        }
        if (step === 3) return !!telegramToken
        return false
    }

    return (
        <div className="min-h-screen bg-[#030014] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#FF4F00]/6 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-4">
                        <span className="text-2xl">🦞</span>
                        <span>InstantClaw</span>
                    </a>
                    <h1 className="text-2xl md:text-3xl font-bold">Set Up Your Agent</h1>
                    <p className="text-gray-500 text-sm mt-2">Just 3 steps to your own AI assistant</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${s < step ? 'bg-[#FF4F00] text-white' : ''}
                ${s === step ? 'bg-[#FF4F00]/20 text-[#FF4F00] border border-[#FF4F00]/40' : ''}
                ${s > step ? 'bg-white/[0.05] text-gray-600 border border-white/[0.08]' : ''}
              `}>
                                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-12 h-0.5 rounded-full ${s < step ? 'bg-[#FF4F00]' : 'bg-white/[0.08]'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Labels */}
                <div className="flex justify-center gap-8 mb-8 text-xs text-gray-600">
                    <span className={step === 1 ? 'text-[#FF4F00]' : ''}>Choose Plan</span>
                    <span className={step === 2 ? 'text-[#FF4F00]' : ''}>Select Model</span>
                    <span className={step === 3 ? 'text-[#FF4F00]' : ''}>Connect Channel</span>
                </div>

                {/* ═══ STEP 1: PLAN ═══ */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            {plans.map((plan) => {
                                const Icon = plan.icon
                                const isSelected = selectedPlan === plan.id
                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`
                      relative text-left p-6 rounded-2xl border transition-all
                      ${isSelected
                                                ? 'border-[#FF4F00]/50 bg-[#FF4F00]/[0.06]'
                                                : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                                            }
                    `}
                                    >
                                        {plan.highlighted && (
                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FF4F00] rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                Popular
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}15` }}>
                                                <Icon className="w-4 h-4" style={{ color: plan.color }} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm">{plan.name}</h3>
                                                <p className="text-[10px] text-gray-600">{plan.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold mb-4">
                                            ${plan.price}<span className="text-xs font-normal text-gray-600">/mo</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {plan.features.map((f) => (
                                                <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                                                    <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: `${plan.color}80` }} />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        {isSelected && (
                                            <div className="absolute top-4 right-4">
                                                <CheckCircle className="w-5 h-5 text-[#FF4F00]" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2: MODEL ═══ */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {models.map((model) => {
                                const isSelected = selectedModel === model.id
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => model.available && setSelectedModel(model.id)}
                                        disabled={!model.available}
                                        className={`
                      w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between
                      ${!model.available ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isSelected && model.available
                                                ? 'border-[#FF4F00]/50 bg-[#FF4F00]/[0.06]'
                                                : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-sm">{model.name}</h3>
                                                    <span className="text-[10px] text-gray-600">{model.provider}</span>
                                                    {model.badge && (
                                                        <span className={`
                              text-[10px] px-2 py-0.5 rounded-full font-medium
                              ${model.badge === 'Coming Soon'
                                                                ? 'bg-gray-500/20 text-gray-400'
                                                                : 'bg-[#FF4F00]/15 text-[#FF4F00]'
                                                            }
                            `}>
                                                            {model.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                                            </div>
                                        </div>
                                        {isSelected && model.available && (
                                            <CheckCircle className="w-5 h-5 text-[#FF4F00] shrink-0" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* API Key Input (Starter plan only) */}
                        {isByok && (
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                                <h4 className="text-sm font-semibold text-amber-400 mb-1">Your API Key Required</h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Since you're on the Starter plan, paste your {models.find(m => m.id === selectedModel)?.provider} API key below.
                                </p>
                                <input
                                    type="password"
                                    placeholder="sk-... or AIza..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full bg-black/30 border border-white/[0.1] rounded-xl py-3 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors font-mono"
                                />
                            </div>
                        )}

                        {!isByok && (
                            <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-4">
                                <p className="text-xs text-green-400">
                                    ✅ Your {currentPlan?.name} plan includes AI credits — no API key needed!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ STEP 3: CHANNEL ═══ */}
                {step === 3 && (
                    <div className="space-y-6">
                        {/* Agent Name */}
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                            <h4 className="text-sm font-semibold mb-3">Name Your Agent</h4>
                            <input
                                type="text"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                placeholder="My Agent"
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF4F00]/40 transition-colors"
                            />
                        </div>

                        {/* Telegram Setup */}
                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">Connect Telegram</h4>
                                    <p className="text-xs text-gray-500">Follow these 5 simple steps</p>
                                </div>
                            </div>

                            <ol className="space-y-3 mb-5">
                                {[
                                    { step: 'Open Telegram and search for @BotFather', link: 'https://t.me/BotFather' },
                                    { step: 'Send /newbot to BotFather' },
                                    { step: 'Choose a name for your bot (e.g. "My AI Assistant")' },
                                    { step: 'Choose a username (must end in "bot", e.g. myai_bot)' },
                                    { step: 'Copy the bot token BotFather gives you' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                            {i + 1}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {item.step}
                                            {item.link && (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 ml-1"
                                                >
                                                    Open <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ol>

                            <input
                                type="text"
                                placeholder="Paste your bot token here (e.g. 123456:ABC-xyz)"
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                className="w-full bg-black/30 border border-white/[0.1] rounded-xl py-3 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors font-mono"
                            />
                        </div>

                        {/* WhatsApp / Discord coming soon */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { name: 'WhatsApp', emoji: '💬' },
                                { name: 'Discord', emoji: '🎮' },
                            ].map((ch) => (
                                <div key={ch.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 opacity-50">
                                    <div className="flex items-center gap-2">
                                        <span>{ch.emoji}</span>
                                        <span className="text-xs font-medium text-gray-500">{ch.name}</span>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-500 ml-auto">Coming Soon</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ NAVIGATION ═══ */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
                    <button
                        onClick={() => setStep(step - 1)}
                        disabled={step === 1}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF4F00] hover:bg-[#E64500] text-white text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleDeploy}
                            disabled={!canProceed() || deploying}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF4F00] hover:bg-[#E64500] text-white text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                        >
                            {deploying ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deploying...
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-4 h-4" />
                                    Deploy My Agent
                                </>
                            )}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        {error}
                    </div>
                )}

                {/* Deploy Summary (Step 3) */}
                {step === 3 && (
                    <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deploy Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Plan</span>
                                <span className="font-medium">{currentPlan?.name} (${currentPlan?.price}/mo)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Model</span>
                                <span className="font-medium">{models.find(m => m.id === selectedModel)?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Channel</span>
                                <span className="font-medium">Telegram</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">API Key</span>
                                <span className="font-medium">{isByok ? 'Your own key' : 'Included credits'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
