"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";
import { Check, ChefHat } from "lucide-react";

const PLANS = [
  { slug: "basic",   name: "Básico",  price: "R$ 99/mês",  desc: "1 unidade · 100 produtos · 5 usuários" },
  { slug: "pro",     name: "Pro",     price: "R$ 199/mês", desc: "3 unidades · ilimitado · IA inclusa", popular: true },
  { slug: "network", name: "Rede",    price: "R$ 399/mês", desc: "Ilimitado · WhatsApp · ERP" },
];

function CadastroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    restaurant_name: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    phone: "",
    plan: searchParams.get("plan") || "pro",
    billing_type: "BOLETO",
    lgpd_consent: false,
  });

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    if (!form.lgpd_consent) { toast.error("Aceite os termos para continuar"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/register", form);

      // Faz login automático
      await login(form.admin_email, form.admin_password, true);

      if (data.payment_url) {
        setPaymentUrl(data.payment_url);
        setStep(3);
      } else {
        toast.success("Conta criada! Bem-vindo ao Produção na Mão 🍳");
        router.push("/dashboard");
      }
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (Array.isArray(detail)) toast.error(detail[0]?.msg || "Erro ao criar conta");
      else toast.error(detail || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b flex items-center gap-3">
          <span className="text-2xl">🍳</span>
          <div>
            <p className="font-bold">Produção na Mão</p>
            <p className="text-xs text-gray-400">14 dias grátis · Sem cartão de crédito</p>
          </div>
        </div>

        {/* Steps indicator */}
        {step < 3 && (
          <div className="px-6 pt-5 flex gap-2">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-brand-500" : "bg-gray-200"}`} />
            ))}
          </div>
        )}

        <div className="p-6">
          {/* Step 1 — Dados */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Sobre o seu restaurante</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do restaurante *</label>
                <input className="input" placeholder="Lanchonete do João" value={form.restaurant_name} onChange={(e) => set("restaurant_name", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome *</label>
                <input className="input" placeholder="João Silva" value={form.admin_name} onChange={(e) => set("admin_name", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input className="input" type="email" placeholder="joao@email.com" value={form.admin_email} onChange={(e) => set("admin_email", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha * (mín. 8 caracteres)</label>
                <input className="input" type="password" placeholder="••••••••" value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input className="input" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <button
                onClick={() => {
                  if (!form.restaurant_name || !form.admin_name || !form.admin_email || !form.admin_password)
                    return toast.error("Preencha todos os campos obrigatórios");
                  if (form.admin_password.length < 8) return toast.error("Senha mínima de 8 caracteres");
                  setStep(2);
                }}
                className="btn-primary w-full mt-2"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2 — Plano + pagamento */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Escolha seu plano</h2>
              <div className="space-y-2">
                {PLANS.map((p) => (
                  <label key={p.slug} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${form.plan === p.slug ? "border-brand-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="plan" value={p.slug} checked={form.plan === p.slug} onChange={() => set("plan", p.slug)} className="accent-brand-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {p.popular && <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">Popular</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                    </div>
                    <span className="font-bold text-sm text-brand-600">{p.price}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
                <select className="input" value={form.billing_type} onChange={(e) => set("billing_type", e.target.value)}>
                  <option value="BOLETO">Boleto bancário</option>
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartão de crédito</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">O primeiro pagamento só é gerado após o teste gratuito de 14 dias.</p>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 cursor-pointer">
                <input type="checkbox" checked={form.lgpd_consent} onChange={(e) => set("lgpd_consent", e.target.checked)} className="mt-0.5 accent-brand-500" />
                <span>
                  Li e concordo com os{" "}
                  <a href="#" className="text-brand-600 underline">Termos de Uso</a>{" "}
                  e a{" "}
                  <a href="#" className="text-brand-600 underline">Política de Privacidade</a>.
                  Meus dados são protegidos conforme a LGPD.
                </span>
              </label>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Voltar</button>
                <button onClick={submit} disabled={loading} className="btn-primary flex-1">
                  {loading ? "Criando conta..." : "Criar conta grátis"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Sucesso + link pagamento */}
          {step === 3 && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check size={32} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-xl">Conta criada com sucesso!</h2>
                <p className="text-gray-500 text-sm mt-2">Seus 14 dias de teste gratuito começam agora.</p>
              </div>
              {paymentUrl && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
                  <p className="font-medium text-gray-700 mb-3">Sua cobrança já foi gerada para quando o teste terminar:</p>
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-primary inline-block w-full">
                    Ver boleto / PIX
                  </a>
                </div>
              )}
              <button onClick={() => router.push("/")} className="btn-primary w-full">
                Ir para o sistema
              </button>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="px-6 pb-5 text-center text-xs text-gray-400">
            Já tem conta?{" "}
            <Link href="/login" className="text-brand-600 underline">Entrar</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    }>
      <CadastroContent />
    </Suspense>
  );
}
