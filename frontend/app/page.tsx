"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChefHat, BarChart2, MessageCircle, Smartphone, TrendingUp, Shield, Zap, Star } from "lucide-react";

const PLANS = [
  {
    slug: "basic",
    name: "Básico",
    price: 99,
    description: "Para quem está começando",
    color: "border-gray-200",
    badge: "",
    features: [
      "1 unidade / estabelecimento",
      "Até 100 produtos",
      "Até 5 usuários",
      "Fichas técnicas ilimitadas",
      "Cálculo de CMV automático",
      "Motor de markup",
      "Relatórios básicos",
    ],
    missing: ["Consultor IA", "WhatsApp", "Integração ERP"],
  },
  {
    slug: "pro",
    name: "Pro",
    price: 199,
    description: "Para restaurantes em crescimento",
    color: "border-brand-500",
    badge: "Mais popular",
    features: [
      "Até 3 unidades",
      "Produtos ilimitados",
      "Até 15 usuários",
      "Fichas técnicas ilimitadas",
      "Cálculo de CMV automático",
      "Motor de markup avançado",
      "Consultor IA (Chef Consultor)",
      "Sugestões de promoções IA",
      "Relatórios completos",
    ],
    missing: ["WhatsApp", "Integração ERP"],
  },
  {
    slug: "network",
    name: "Rede",
    price: 399,
    description: "Para redes e franquias",
    color: "border-gray-800",
    badge: "",
    features: [
      "Unidades ilimitadas",
      "Produtos ilimitados",
      "Usuários ilimitados",
      "Tudo do plano Pro",
      "WhatsApp (ficha + alertas + relatórios)",
      "Integração ERP (Linx, TOTVS, etc.)",
      "Suporte prioritário",
    ],
    missing: [],
  },
];

const FEATURES = [
  { icon: ChefHat, title: "Fichas Técnicas", desc: "Cadastre ingredientes, quantidades e modo de preparo. CMV calculado automaticamente." },
  { icon: TrendingUp, title: "Markup Inteligente", desc: "Defina regras por curva ABC ou categoria. O sistema sugere o preço ideal para sua margem." },
  { icon: BarChart2, title: "Análise de Cardápio", desc: "Identifique campeões e vilões do seu cardápio com relatórios de CMV e curva ABC." },
  { icon: MessageCircle, title: "Chef Consultor IA", desc: "Chat inteligente que responde dúvidas sobre preparo, CMV e gastronomia brasileira 24h." },
  { icon: Smartphone, title: "WhatsApp Integrado", desc: "Envie fichas técnicas para a cozinha e relatórios diários direto no WhatsApp." },
  { icon: Shield, title: "LGPD e Segurança", desc: "Dados criptografados, audit log completo e consentimento de privacidade embutido." },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) router.replace("/dashboard");
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="font-bold text-gray-900">Produção na Mão</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Entrar</Link>
            <Link href="/cadastro" className="btn-primary text-sm">Testar grátis 14 dias</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} /> Novo: Consultor IA integrado ao cardápio
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          Gestão de fichas técnicas e CMV{" "}
          <span className="text-brand-500">na palma da mão</span>
        </h1>
        <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          Calcule CMV, defina preços com markup inteligente, envie fichas técnicas pelo WhatsApp
          e conte com um consultor IA especialista em gastronomia brasileira.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link href="/cadastro" className="btn-primary text-base px-8 py-3">
            Começar grátis — 14 dias sem cartão
          </Link>
          <Link href="#planos" className="btn-secondary text-base px-8 py-3">
            Ver planos e preços
          </Link>
        </div>
        <p className="text-gray-400 text-sm mt-4">Sem contrato. Cancele quando quiser.</p>
      </section>

      {/* ── Prova social ── */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-center">
          {[["+200", "restaurantes"], ["R$ 0", "no teste gratuito"], ["14 dias", "de avaliação"], ["LGPD", "em conformidade"]].map(([n, l]) => (
            <div key={l}>
              <p className="text-2xl font-bold text-brand-500">{n}</p>
              <p className="text-sm text-gray-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">Tudo que seu restaurante precisa</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">De x-burguer a buffet — o Produção na Mão se adapta ao seu tipo de operação.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand-500" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Planos e preços</h2>
            <p className="text-gray-500 mt-3">14 dias grátis em qualquer plano. Sem cartão de crédito.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div key={plan.slug} className={`bg-white rounded-2xl border-2 ${plan.color} p-8 relative`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="font-bold text-xl">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  <span className="text-gray-400 text-sm">/mês</span>
                </div>
                <Link href={`/cadastro?plan=${plan.slug}`}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors mb-6 ${plan.badge ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                  Começar grátis
                </Link>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className="text-green-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="shrink-0 mt-0.5 w-3.5 text-center">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold">Pronto para ter o CMV sob controle?</h2>
        <p className="text-gray-500 mt-4 max-w-xl mx-auto">Crie sua conta agora e comece a usar em minutos. Sem burocracia, sem cartão.</p>
        <Link href="/cadastro" className="btn-primary text-base px-10 py-4 inline-block mt-8">
          Criar minha conta gratuita
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍳</span>
            <span className="font-medium text-gray-600">Produção na Mão</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-600">Termos de Uso</a>
            <a href="#" className="hover:text-gray-600">Privacidade</a>
            <a href="mailto:contato@producaonamao.com.br" className="hover:text-gray-600">Contato</a>
          </div>
          <p>© 2025 Produção na Mão · LGPD em conformidade</p>
        </div>
      </footer>
    </div>
  );
}
