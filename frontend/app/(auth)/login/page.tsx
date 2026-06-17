"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, lgpdConsent);
      router.push("/");
    } catch (err: any) {
      if (err.response?.status === 451) {
        setNeedsConsent(true);
        toast.error("Aceite os termos de uso para continuar (exigência da LGPD)");
      } else {
        toast.error(err.response?.data?.detail || "Email ou senha inválidos");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🍳</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Produção na Mão</h1>
          <p className="text-gray-500 text-sm mt-1">Acesse sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {needsConsent && (
            <label className="flex items-start gap-2 text-sm text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <input type="checkbox" checked={lgpdConsent} onChange={(e) => setLgpdConsent(e.target.checked)} className="mt-0.5 accent-brand-500" />
              <span>
                Concordo com os{" "}
                <a href="#" className="text-brand-600 underline">Termos de Uso</a>{" "}
                e a{" "}
                <a href="#" className="text-brand-600 underline">Política de Privacidade</a>{" "}
                (LGPD — Lei 13.709/2018)
              </span>
            </label>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
