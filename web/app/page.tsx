'use client';

import { useState, useRef, MouseEvent, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useInView } from 'framer-motion';
import { Bot, CheckCircle, ArrowRight, Clock, Cloud, MessageSquare, Globe, Layers, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Reusable Components ---

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn("group relative border border-white/[0.08] bg-white/[0.02] overflow-hidden rounded-2xl", className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(255, 79, 0, 0.06), transparent 80%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Educational Use-Case Cards (extracted from openclaw.ai/showcase) ---
type UCCard = { emoji: string; title: string; desc: string };

const lifeCards: UCCard[] = [
  { emoji: "🍳", title: "Plan Your Family's Meals", desc: "Tell it your dietary preferences and budget. It creates a full weekly meal plan in Notion — with a shopping list sorted by store aisle." },
  { emoji: "☀️", title: "Get a Morning Briefing", desc: "Wake up to a daily summary: today's weather, your calendar, yesterday's stats, and what needs your attention first." },
  { emoji: "📧", title: "Reach Inbox Zero Automatically", desc: "It reads your email, deletes spam, drafts follow-ups, and flags anything urgent — before you even open Gmail." },
  { emoji: "💰", title: "Split Trip Expenses", desc: "Going on a trip with friends? It tracks every cost, splits bills fairly, and sends everyone a summary." },
  { emoji: "🏠", title: "Control Your Smart Home", desc: "'Turn off the lights and lock the door' — just message it. Works with Homey, Home Assistant, and more." },
  { emoji: "🏃", title: "Track Your Health Goals", desc: "Connect WHOOP or Fitbit data. It monitors your recovery, suggests rest days, and adjusts your workout plan." },
];
const workCards: UCCard[] = [
  { emoji: "📅", title: "Auto-Block Your Calendar", desc: "Scores your tasks by priority, then time-blocks your Google Calendar for the day. Every morning, automatically." },
  { emoji: "📋", title: "Manage Your Projects", desc: "Clean up Linear or Jira issues, write status updates, and open PRs — all while you focus on deep work." },
  { emoji: "👔", title: "Find New Customers Daily", desc: "It prospects new signups, writes personalized outreach emails, and logs everything to your CRM — every single day." },
  { emoji: "📊", title: "Build Analytics Dashboards", desc: "Connect GA4 and get custom analytics reports built and published in under 20 minutes. No coding needed." },
  { emoji: "📑", title: "Generate Reports from Chats", desc: "It reads your Slack or Telegram threads and produces polished PDF summaries — perfect for weekly standups." },
  { emoji: "🧾", title: "Create & Send Invoices", desc: "Just say 'invoice client X for 5 hours of consulting' and it generates, formats, and sends a professional invoice." },
];

const devCards: UCCard[] = [
  { emoji: "🌐", title: "Rebuild a Website from Bed", desc: "One developer rebuilt their entire site (Notion → Astro) and migrated DNS — all from Telegram while lying in bed." },
  { emoji: "🛠️", title: "Fix Deployments by Voice", desc: "Your deploy failed? Talk to your agent on a walk — it reviews logs, changes build commands, and redeploys." },
  { emoji: "🐛", title: "Refactor Code & Ship to npm", desc: "Run 15+ agents that build CLI tools, refactor PRs, refresh SDK docs, and publish to npm — hands-free." },
  { emoji: "📱", title: "Build Features from Your Phone", desc: "Spin up an agent for any new feature request, right from Telegram. It codes, tests, and opens a PR." },
  { emoji: "🔧", title: "It Learns New Skills Itself", desc: "Ask it to learn something new and it self-installs the skill. It even changed its own voice model on request." },
  { emoji: "🔑", title: "Manage Passwords & Secrets", desc: "Securely integrate with 1Password. It can look up, create, and organize credentials on your behalf." },
];

// Color themes per category
const rowThemes = {
  life: { accent: '#FF6B35', gradient: 'from-[#FF6B35]/15 to-transparent', iconBg: 'bg-[#FF6B35]/12', iconBorder: 'border-[#FF6B35]/20', labelColor: '#FF6B35' },
  work: { accent: '#818CF8', gradient: 'from-[#818CF8]/15 to-transparent', iconBg: 'bg-[#818CF8]/12', iconBorder: 'border-[#818CF8]/20', labelColor: '#818CF8' },
  dev: { accent: '#34D399', gradient: 'from-[#34D399]/15 to-transparent', iconBg: 'bg-[#34D399]/12', iconBorder: 'border-[#34D399]/20', labelColor: '#34D399' },
};

function UseCaseMarqueeRow({ items, reverse = false, speed = 35, label, theme }: {
  items: UCCard[]; reverse?: boolean; speed?: number; label?: string;
  theme: typeof rowThemes.life;
}) {
  return (
    <div className="relative group/row">
      {label && (
        <div className={cn("flex items-center gap-3 mb-4 px-6", reverse ? "justify-end" : "justify-start")}>
          <div className="h-[2px] w-10 rounded-full" style={{ background: `linear-gradient(to right, ${theme.accent}60, transparent)` }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: `${theme.accent}88` }}>{label}</span>
          <div className="h-[2px] w-10 rounded-full" style={{ background: `linear-gradient(to left, ${theme.accent}60, transparent)` }} />
        </div>
      )}
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div
          className={cn(
            "flex gap-5 py-2 group-hover/row:[animation-play-state:paused]",
            reverse ? "animate-marquee-reverse" : "animate-marquee"
          )}
          style={{
            animationDuration: `${speed}s`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {[...items, ...items].map((item, i) => (
            <div
              key={i}
              className="group/card relative flex-shrink-0 w-[360px] cursor-default"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="relative h-full rounded-2xl overflow-hidden border border-white/[0.06] group-hover/card:border-white/[0.14] transition-colors duration-300">
                {/* Top accent gradient bar */}
                <div className="h-[2px] w-full" style={{ background: `linear-gradient(to right, transparent, ${theme.accent}50, ${theme.accent}30, transparent)` }} />

                {/* Card body */}
                <div className="relative p-6" style={{ background: '#111' }}>
                  {/* Hover gradient overlay */}
                  <div className={cn("absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br", theme.gradient)} />

                  <div className="relative flex gap-4">
                    {/* Emoji container */}
                    <div className={cn("flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl border", theme.iconBg, theme.iconBorder)}>
                      {item.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white mb-2 leading-snug">{item.title}</h4>
                      <p className="text-[12px] text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// --- Comparison Table ---
const traditionalSteps = [
  { step: "Purchasing a virtual machine", time: "15 min" },
  { step: "Creating SSH keys and storing securely", time: "10 min" },
  { step: "Connecting to the server via SSH", time: "5 min" },
  { step: "Installing Node.js and NPM", time: "5 min" },
  { step: "Installing OpenClaw", time: "7 min" },
  { step: "Setting up OpenClaw", time: "10 min" },
  { step: "Connecting to AI provider", time: "4 min" },
  { step: "Pairing with Telegram", time: "4 min" },
];

// --- Main Page ---
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-orange-500/20 overflow-x-hidden">

      {/* Subtle top glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-orange-500/[0.04] blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            <span className="text-xl">🦞</span>
            <span>InstantClaw</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm text-gray-500">
            <a href="#comparison" className="hover:text-white transition-colors">How it Works</a>
            <a href="#usecases" className="hover:text-white transition-colors">Use Cases</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <a href="/auth" className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            Get Started
          </a>
        </div>
      </nav>

      <main className="relative z-10">

        {/* ═══════════════════════════════════════════ */}
        {/* HERO                                        */}
        {/* ═══════════════════════════════════════════ */}
        <section className="pt-32 pb-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                  Deploy OpenClaw
                </span>
                <br />
                <span className="bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                  under 1 minute
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                Avoid all technical complexity and one-click deploy your own 24/7 active OpenClaw instance under 1 minute.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="/auth"
                  className="group px-8 py-3.5 bg-[#FF4F00] hover:bg-[#E64500] text-white rounded-xl font-semibold text-base transition-all flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(255,79,0,0.4)]"
                >
                  Deploy Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500/70" /> No credit card required
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* COMPARISON: Traditional vs InstantClaw      */}
        {/* ═══════════════════════════════════════════ */}
        <section id="comparison" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-[#FF4F00] tracking-wider uppercase">Comparison</span>
                <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight">
                  Traditional Method vs InstantClaw
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Traditional Side */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                  <h3 className="text-lg font-medium text-gray-400 italic mb-6">Traditional</h3>
                  <div className="space-y-0">
                    {traditionalSteps.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-b-0">
                        <span className="text-sm text-gray-400">{item.step}</span>
                        <span className="text-sm text-gray-500 font-mono tabular-nums">{item.time}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/[0.1]">
                      <span className="text-base font-bold text-white">Total</span>
                      <span className="text-base font-bold text-white font-mono">60 min</span>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-gray-600 italic">
                    If you&apos;re <span className="text-red-400 font-medium not-italic">non-technical</span>, multiply these <span className="text-red-400 font-medium not-italic">times by 10</span> — you have to learn each step before doing.
                  </p>
                </div>

                {/* InstantClaw Side */}
                <div className="rounded-2xl border border-[#FF4F00]/20 bg-[#FF4F00]/[0.03] p-8 flex flex-col">
                  <h3 className="text-lg font-medium text-gray-400 italic mb-4">InstantClaw</h3>
                  <div className="text-6xl md:text-7xl font-bold text-white mb-6">&lt;1 min</div>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Pick a model, connect Telegram, deploy — done under 1 minute.
                  </p>
                  <p className="text-gray-500 leading-relaxed flex-1">
                    Servers, SSH and OpenClaw Environment are already set up, waiting to get assigned. Simple, secure and fast connection to your bot.
                  </p>
                  <a
                    href="#"
                    className="mt-8 inline-flex items-center gap-2 text-[#FF4F00] font-semibold text-sm hover:underline"
                  >
                    Start deploying <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* USE CASES — Educational Scrolling Boxes      */}
        {/* ═══════════════════════════════════════════ */}
        <section id="usecases" className="relative py-28 px-6 overflow-hidden">
          {/* Section background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-[#FF4F00]/[0.025] blur-[150px]" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF4F00]/20 bg-[#FF4F00]/[0.05] mb-6">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[#FF4F00] animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#FF4F00] tracking-wider uppercase">Inspired by real users</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent pb-2">
                  What will you build?
                </h2>
                <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  People are already using OpenClaw to automate their entire lives — from cooking plans to code reviews. Here&apos;s how you could use it too.
                </p>
              </div>
            </FadeIn>
          </div>

          <div className="relative z-10">
            <FadeIn delay={0.15}>
              <div className="space-y-8">
                <UseCaseMarqueeRow items={lifeCards} speed={45} label="Everyday Life" theme={rowThemes.life} />
                <UseCaseMarqueeRow items={workCards} reverse speed={40} label="Work & Productivity" theme={rowThemes.work} />
                <UseCaseMarqueeRow items={devCards} speed={50} label="Developer & Technical" theme={rowThemes.dev} />
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="text-center mt-14">
                <p className="text-sm text-gray-600">
                  All use cases above are from real OpenClaw users at{' '}
                  <a href="https://openclaw.ai/showcase" target="_blank" rel="noopener noreferrer" className="text-[#FF4F00]/60 hover:text-[#FF4F00] hover:underline transition-colors">
                    openclaw.ai/showcase
                  </a>
                </p>
                <p className="mt-2 text-xs text-gray-700">You can teach your agent anything via natural language.</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* WHY INSTANTCLAW (Bento)                     */}
        {/* ═══════════════════════════════════════════ */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Why InstantClaw?</h2>
                <p className="mt-4 text-lg text-gray-500">Running it on your laptop is fine for testing. Running it here is for business.</p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-4">
              <FadeIn delay={0.1}>
                <SpotlightCard className="h-full">
                  <div className="p-8">
                    <Clock className="w-8 h-8 text-[#FF4F00]/70 mb-5" />
                    <h3 className="text-xl font-bold mb-3">Works While You Sleep</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Your laptop closes. Your agent doesn&apos;t. We keep your OpenClaw instance running 24/7/365 in the cloud.
                    </p>
                  </div>
                </SpotlightCard>
              </FadeIn>
              <FadeIn delay={0.2}>
                <SpotlightCard className="h-full">
                  <div className="p-8">
                    <MessageSquare className="w-8 h-8 text-[#FF4F00]/70 mb-5" />
                    <h3 className="text-xl font-bold mb-3">Any Chat App</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      WhatsApp, Telegram, Discord, Slack — manage your agent from the apps you already use every day.
                    </p>
                  </div>
                </SpotlightCard>
              </FadeIn>
              <FadeIn delay={0.3}>
                <SpotlightCard className="h-full">
                  <div className="p-8">
                    <Globe className="w-8 h-8 text-[#FF4F00]/70 mb-5" />
                    <h3 className="text-xl font-bold mb-3">Real Browser Control</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      It browses the web, fills forms, extracts data from any website. Just like a human would.
                    </p>
                  </div>
                </SpotlightCard>
              </FadeIn>
              <FadeIn delay={0.4}>
                <SpotlightCard className="h-full">
                  <div className="p-8">
                    <Layers className="w-8 h-8 text-[#FF4F00]/70 mb-5" />
                    <h3 className="text-xl font-bold mb-3">Persistent Memory</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      It remembers your preferences and context. The more you use it, the better it gets.
                    </p>
                  </div>
                </SpotlightCard>
              </FadeIn>
              <FadeIn delay={0.5}>
                <SpotlightCard className="h-full">
                  <div className="p-8">
                    <Cloud className="w-8 h-8 text-[#FF4F00]/70 mb-5" />
                    <h3 className="text-xl font-bold mb-3">Zero Config</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      No Docker. No terminal. No npm install. Click a button, pick your model, and you&apos;re live.
                    </p>
                  </div>
                </SpotlightCard>
              </FadeIn>
              <FadeIn delay={0.6}>
                <SpotlightCard className="h-full">
                  <div className="p-8">
                    <Sparkles className="w-8 h-8 text-[#FF4F00]/70 mb-5" />
                    <h3 className="text-xl font-bold mb-3">Skills & Plugins</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Extend with community skills or build your own. Lead gen, email, calendar — it&apos;s all there.
                    </p>
                  </div>
                </SpotlightCard>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* PRICING                                     */}
        {/* ═══════════════════════════════════════════ */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple Pricing</h2>
                <p className="mt-4 text-lg text-gray-500">Honest plans. Only features we actually deliver.</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Starter',
                    subtitle: 'Bring Your Own Keys',
                    price: '15',
                    features: [
                      '1 always-on agent',
                      'Telegram connection',
                      'BYOK — your own API keys',
                      'Auto-updates to latest OpenClaw',
                      'Community support (Discord)',
                    ],
                    highlighted: false,
                  },
                  {
                    name: 'Pro',
                    subtitle: 'Most Popular',
                    price: '39',
                    features: [
                      'Everything in Starter',
                      '$15/mo AI credits included',
                      'Telegram + WhatsApp + Discord',
                      'Install community skills',
                      'Usage stats & agent logs',
                      'Email support',
                    ],
                    highlighted: true,
                  },
                  {
                    name: 'Business',
                    subtitle: 'For Power Users',
                    price: '59',
                    features: [
                      'Everything in Pro',
                      '$25/mo AI credits included',
                      'All channels supported',
                      'Install community skills',
                      'Priority support (fast response)',
                      'Early access to new features',
                    ],
                    highlighted: false,
                  },
                ].map((plan) => (
                  <SpotlightCard key={plan.name} className={cn(plan.highlighted && "border-[#FF4F00]/30 bg-[#FF4F00]/[0.03]")}>
                    <div className="p-8">
                      <h3 className="text-lg font-medium text-gray-300 mb-0.5">{plan.name}</h3>
                      <p className="text-xs text-gray-600 mb-4">{plan.subtitle}</p>
                      <div className="text-4xl font-bold mb-6">
                        ${plan.price}<span className="text-sm font-normal text-gray-600">/mo</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 text-[#FF4F00]/60 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className={cn(
                        "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                        plan.highlighted
                          ? "bg-[#FF4F00] hover:bg-[#E64500] text-white shadow-lg shadow-orange-500/20"
                          : "bg-white/[0.06] hover:bg-white/[0.1] text-white"
                      )}>
                        {plan.highlighted ? 'Get Started' : `Choose ${plan.name}`}
                      </button>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* FOOTER                                      */}
        {/* ═══════════════════════════════════════════ */}
        <footer className="border-t border-white/[0.06] py-12 px-6 text-center">
          <div className="text-gray-600 text-sm">
            © 2026 InstantClaw Inc. <span className="mx-2">•</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a> <span className="mx-2">•</span>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </footer>

      </main>

      {/* Marquee animation keyframes */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marquee-reverse {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes shimmer {
          0% { transform: translate3d(-100%, 0, 0); }
          100% { transform: translate3d(100%, 0, 0); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 40s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
