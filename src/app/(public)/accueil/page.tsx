'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Brain,
  Wallet,
  CalendarCheck,
  Search,
  GraduationCap,
  MessageSquareText,
  Shield,
  Award,
  Users,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { PLANS_PRICING } from '@/lib/constants'

// ─── Animation variants ───
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Data ───
const features = [
  {
    icon: Brain,
    title: 'Pipeline intelligent',
    description: 'Scoring IA /100, 11 statuts personnalisables, drag-drop Kanban. Vos leads les plus chauds remontent automatiquement.',
    gradient: 'from-[#FF5C00] to-[#FF8C42]',
  },
  {
    icon: Wallet,
    title: 'Financement automatis\u00e9',
    description: 'OPCO, CPF, France Travail, P\u00f4le Emploi. 12 organismes pr\u00e9-configur\u00e9s, checklist documents, relances auto.',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    icon: CalendarCheck,
    title: 'Sessions & planning',
    description: 'Calendrier visuel, gestion formatrices et salles, \u00e9margement QR digital. Conformit\u00e9 Qualiopi int\u00e9gr\u00e9e.',
    gradient: 'from-[#FF2D78] to-[#FF6BA8]',
  },
  {
    icon: Search,
    title: 'Analyse concurrentielle',
    description: '25 sources de donn\u00e9es, veille automatique, positionnement tarifaire. Gardez une longueur d\u2019avance.',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    icon: GraduationCap,
    title: 'LMS int\u00e9gr\u00e9',
    description: 'Supports de formation style Udemy, quiz, progression, certificats PDF. Tout le parcours apprenant en un clic.',
    gradient: 'from-pink-500 to-rose-400',
  },
  {
    icon: MessageSquareText,
    title: 'Chatbot IA commercial',
    description: '13 outils IA : scoring, objections, scripts, relances. Votre assistant commercial qui ne dort jamais.',
    gradient: 'from-[#FF5C00] to-[#FF8C42]',
  },
]

const stats = [
  { value: '25+', label: 'Sources de donn\u00e9es', icon: Search },
  { value: '11', label: 'Formations', icon: BookOpen },
  { value: '500+', label: 'Stagiaires form\u00e9s', icon: Users },
  { value: '4.8', label: 'Satisfaction', icon: Star, suffix: '\u2605' },
]

const plans = PLANS_PRICING.slice(0, 3) // Prendre seulement les 3 premiers plans pour la landing

const trustBadges = [
  { icon: Shield, label: 'Certifi\u00e9 Qualiopi' },
  { icon: Award, label: 'Partenaire NPM France' },
  { icon: Users, label: '500+ stagiaires form\u00e9s' },
]

// ─── Page ───
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ════════════════ HERO ════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-24 text-center overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0a3a6b 40%, #0e4d8f 70%, #1a6fb5 100%)',
          }}
        />
        {/* Decorative orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF5C00]/20 rounded-full blur-[120px] -z-[5]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF5C00]/10 rounded-full blur-[150px] -z-[5]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full -z-[5]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#FF5C00]" />
            <span className="text-sm text-white/80">Propuls&eacute; par l&apos;IA</span>
          </motion.div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Le CRM intelligent pour les{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-[#6DD5FA]">
              centres de formation esth&eacute;tique
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#999999] max-w-2xl mx-auto mb-10 leading-relaxed">
            G&eacute;rez vos leads, automatisez votre prospection, et doublez vos inscriptions.
            Pipeline, financement, Qualiopi &mdash; tout en un.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5C00] hover:bg-[#1ab5e2] text-white font-semibold px-8 py-4 text-base transition-all duration-200 shadow-lg shadow-[#FF5C00]/25 hover:shadow-xl hover:shadow-[#FF5C00]/30"
            >
              Essai gratuit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/25 hover:border-white/50 text-white font-semibold px-8 py-4 text-base transition-all duration-200 backdrop-blur-sm"
            >
              Voir les tarifs
            </Link>
          </div>
        </motion.div>

        {/* Hero visual — gradient dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-5xl mx-auto mt-4"
        >
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-1 shadow-2xl">
            <div className="rounded-xl bg-gradient-to-br from-[#1A1A1A]/80 to-[#0e4d8f]/60 aspect-[16/9] flex flex-col">
              {/* Fake titlebar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <div className="flex-1 flex justify-center">
                  <div className="w-48 h-5 rounded bg-white/10" />
                </div>
              </div>
              {/* Fake content */}
              <div className="flex-1 p-4 sm:p-6 grid grid-cols-4 gap-3 sm:gap-4">
                {/* Sidebar */}
                <div className="col-span-1 space-y-3 hidden sm:block">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-8 rounded-lg"
                      style={{
                        background: i === 0 ? 'rgba(46,198,243,0.2)' : 'rgba(255,255,255,0.06)',
                        width: `${65 + (i * 7) % 35}%`,
                      }}
                    />
                  ))}
                </div>
                {/* Main area — pipeline columns */}
                <div className="col-span-4 sm:col-span-3 grid grid-cols-3 gap-2 sm:gap-3">
                  {['Nouveau', 'Qualification', 'Inscription'].map((col) => (
                    <div key={col} className="space-y-2 sm:space-y-3">
                      <div className="text-[10px] sm:text-xs text-white/40 font-medium px-1">{col}</div>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-16 sm:h-20 rounded-lg bg-white/[0.06] border border-white/[0.08] p-2 sm:p-3"
                        >
                          <div className="w-3/4 h-2 sm:h-2.5 rounded bg-white/15 mb-1.5 sm:mb-2" />
                          <div className="w-1/2 h-1.5 sm:h-2 rounded bg-white/10 mb-2 sm:mb-3" />
                          <div className="flex gap-1">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FF5C00]/20" />
                            <div className="flex-1 h-1.5 sm:h-2 rounded bg-white/[0.08] mt-1.5 sm:mt-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════ TRUST BADGES ════════════════ */}
      <section className="bg-white py-12 px-4 border-b border-[#F0F0F0]">
        <AnimatedSection className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            {trustBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <motion.div
                  key={badge.label}
                  variants={fadeUp}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#FF5C00]" />
                  </div>
                  <span className="text-sm font-semibold text-[#1A1A1A]">{badge.label}</span>
                </motion.div>
              )
            })}
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════ FEATURES ════════════════ */}
      <section className="bg-white py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-[#FF5C00]/10 px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-[#FF5C00]" />
              <span className="text-sm font-medium text-[#FF5C00]">6 modules puissants</span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Tout ce dont votre centre a besoin
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#777777] max-w-xl mx-auto text-lg">
              De la premi&egrave;re prise de contact &agrave; la certification, chaque &eacute;tape est couverte.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  className="group relative p-6 rounded-2xl border border-[#F0F0F0] bg-white hover:border-[#FF5C00]/30 hover:shadow-lg hover:shadow-[#FF5C00]/5 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3
                    className="text-lg font-bold text-[#1A1A1A] mb-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#777777] leading-relaxed">{feature.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    En savoir plus <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              )
            })}
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════ STATS ════════════════ */}
      <section className="bg-[#FAFAFA] py-20 px-4 sm:px-6">
        <AnimatedSection className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-[#FF5C00]" />
                  </div>
                  <div
                    className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-1"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {stat.value}{stat.suffix || ''}
                  </div>
                  <div className="text-sm text-[#777777]">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════ PRICING PREVIEW ════════════════ */}
      <section className="bg-white py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-[#FF5C00]/10 px-4 py-1.5 mb-6">
              <TrendingUp className="w-4 h-4 text-[#FF5C00]" />
              <span className="text-sm font-medium text-[#FF5C00]">Tarifs transparents</span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Des tarifs pens&eacute;s pour les TPE
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#777777] max-w-xl mx-auto text-lg">
              14 jours d&apos;essai gratuit. Sans carte bancaire. Sans engagement.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`relative flex flex-col bg-white rounded-2xl border-2 p-7 transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-[#FF5C00] shadow-xl shadow-[#FF5C00]/10 md:scale-[1.03]'
                    : 'border-[#F0F0F0] hover:border-[#F0F0F0] hover:shadow-md'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-[#FF5C00] px-4 py-1 text-xs font-bold text-white tracking-wide uppercase">
                    Populaire
                  </span>
                )}

                <h3
                  className="text-xl font-bold text-[#1A1A1A] mb-1"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className="text-4xl font-bold text-[#1A1A1A]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-sm text-[#999999]">{plan.period}</span>}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#777777]">
                      <Check className="w-4 h-4 text-[#FF5C00] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`block text-center rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-[#FF5C00] hover:bg-[#1ab5e2] text-white shadow-sm hover:shadow-md'
                      : 'border-2 border-[#F0F0F0] bg-white hover:bg-[#FAFAFA] hover:border-[#F0F0F0] text-[#1A1A1A]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </AnimatedSection>

          <motion.p variants={fadeUp} className="text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1 text-sm text-[#FF5C00] hover:underline font-semibold">
              Voir tous les plans <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ════════════════ FORMATIONS PREVIEW ════════════════ */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: '#FAFAFA' }}>
        <AnimatedSection className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: '#FFF0E5', color: '#FF5C00' }}>
              <GraduationCap size={14} />
              Certifié Qualiopi
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
              11 formations pour lancer votre activité
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#777777' }}>
              De la dermo-pigmentation au laser, financées jusqu'à 100% par votre OPCO ou CPF.
              Paris 11e — Petits groupes — Pratique sur modèles.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { cat: 'Dermo-Esthétique', count: '6 formations', prix: 'À partir de 450€', color: '#FF5C00' },
              { cat: 'Soins Visage & Corps', count: '3 formations', prix: 'À partir de 990€', color: '#FF2D78' },
              { cat: 'Laser & Réglementaire', count: '2 formations', prix: 'À partir de 1 500€', color: '#10B981' },
            ].map((item, i) => (
              <Link
                key={i}
                href="/formations"
                className="group p-6 rounded-2xl transition-all hover:-translate-y-1"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', boxShadow: '0 1px 4px rgba(26,26,26,0.04)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${item.color}15` }}>
                  <GraduationCap size={20} style={{ color: item.color }} />
                </div>
                <h3 className="font-bold mb-1 group-hover:text-[#FF5C00] transition-colors" style={{ color: '#111111' }}>
                  {item.cat}
                </h3>
                <p className="text-sm" style={{ color: '#777777' }}>{item.count} — {item.prix}</p>
              </Link>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/formations"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105"
              style={{ backgroundColor: '#FF5C00', boxShadow: '0 0 24px rgba(255,92,0,0.25)' }}
            >
              Voir toutes les formations
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/accessibilite"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all"
              style={{ border: '2px solid #EEEEEE', color: '#111111' }}
            >
              Accessibilité & Handicap
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ════════════════ CTA FINAL ════════════════ */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #111111 0%, #1A1A1A 100%)',
          }}
        />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#FF5C00]/15 rounded-full blur-[100px] -z-[5]" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#FF2D78]/10 rounded-full blur-[80px] -z-[5]" />

        <AnimatedSection className="max-w-3xl mx-auto text-center">
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Pr&ecirc;t &agrave; transformer votre centre de formation ?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-[#999999] mb-10 max-w-xl mx-auto">
            Rejoignez les centres qui ont d&eacute;j&agrave; doubl&eacute; leurs inscriptions gr&acirc;ce &agrave; Satorea.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5C00] hover:bg-[#1ab5e2] text-white font-semibold px-10 py-4 text-lg transition-all duration-200 shadow-lg shadow-[#FF5C00]/25 hover:shadow-xl hover:shadow-[#FF5C00]/30"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="text-sm text-[#999999] mt-6">
            Gratuit pour d&eacute;marrer &middot; Sans carte bancaire &middot; Configuration en 5 minutes
          </motion.p>
        </AnimatedSection>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="bg-[#1A1A1A] text-[#999999] pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Produit */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Produit
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/formations" className="hover:text-[#FF5C00] transition-colors">
                    Formations
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#FF5C00] transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/aide" className="hover:text-[#FF5C00] transition-colors">
                    Aide
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-[#FF5C00] transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Formation */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Formations
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/formations" className="hover:text-[#FF5C00] transition-colors">
                    Catalogue
                  </Link>
                </li>
                <li>
                  <Link href="/accessibilite" className="hover:text-[#FF5C00] transition-colors">
                    Accessibilit&eacute; &amp; Handicap
                  </Link>
                </li>
                <li>
                  <Link href="/formations" className="hover:text-[#FF5C00] transition-colors">
                    Financement OPCO / CPF
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                L&eacute;gal
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/conditions-generales" className="hover:text-[#FF5C00] transition-colors">
                    CGV
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-[#FF5C00] transition-colors">
                    Mentions l&eacute;gales
                  </Link>
                </li>
                <li>
                  <Link href="/politique-confidentialite" className="hover:text-[#FF5C00] transition-colors">
                    Confidentialit&eacute;
                  </Link>
                </li>
                <li>
                  <Link href="/dpa" className="hover:text-[#FF5C00] transition-colors">
                    DPA
                  </Link>
                </li>
                <li>
                  <Link href="/accessibilite" className="hover:text-[#FF5C00] transition-colors">
                    Accessibilit&eacute;
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Contact
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>support@satorea.fr</li>
                <li>01 88 33 43 43</li>
                <li>75 Bd Richard Lenoir</li>
                <li>75011 Paris</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF5C00] flex items-center justify-center">
                <span className="text-white font-bold text-xs" style={{ fontFamily: 'var(--font-heading)' }}>D</span>
              </div>
              <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Dermotec Advanced
              </span>
            </div>
            <p className="text-xs text-[#777777]">
              &copy; 2026 Dermotec Advanced &middot; Satorea SAS &middot; Made in Paris
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
