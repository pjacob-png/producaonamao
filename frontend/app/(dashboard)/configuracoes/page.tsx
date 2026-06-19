"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";
import { User, Lock, Building2, CreditCard } from "lucide-react";

export default function ConfiguracoesPage() {
  const { user, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await api.patch("/users/me", profileForm);
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) return toast.error("As senhas não conferem");
    if (pwForm.next.length < 8) return toast.error("Senha mínima de 8 caracteres");
    setSavingPw(true);
    try {
      await api.post("/users/me/change-password", {
        current_password: pwForm.current,
        new_password: pwForm.next,
      });
      toast.success("Senha alterada com sucesso!");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erro ao alterar senha");
    } finally {
      setSavingPw(false);
    }
  }

  async function requestDataExport() {
    try {
      await api.post("/users/me/data-export");
      toast.success("Solicitação enviada! Você receberá um e-mail com seus dados em até 24h.");
    } catch {
      toast.error("Erro ao solicitar exportação");
    }
  }

  async function requestAccountDeletion() {
    const confirmed = window.confirm(
      "Tem certeza? Sua conta e TODOS os dados serão excluídos permanentemente. Esta ação é irreversível."
    );
    if (!confirmed) return;
    try {
      await api.delete("/users/me");
      toast.success("Conta marcada para exclusão. Você será desconectado.");
      setTimeout(logout, 2000);
    } catch {
      toast.error("Erro ao solicitar exclusão. Entre em contato com o suporte.");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Configurações</h2>
        <p className="text-gray-500 text-sm">Gerencie sua conta e preferências</p>
      </div>

      {/* Perfil */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-brand-500" />
          <h3 className="font-semibold">Meu perfil</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.email || ""} disabled />
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              className="input"
              value={profileForm.name}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              className="input"
              placeholder="(11) 99999-9999"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <button onClick={saveProfile} disabled={savingProfile} className="btn-primary">
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </div>

      {/* Plano */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-brand-500" />
          <h3 className="font-semibold">Plano e assinatura</h3>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 capitalize">
              Plano {user?.plan || "—"}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {user?.plan === "basic" && "1 unidade · 100 produtos · 5 usuários"}
              {user?.plan === "pro" && "3 unidades · ilimitado · IA inclusa"}
              {user?.plan === "network" && "Ilimitado · WhatsApp · ERP"}
            </p>
          </div>
          <span className="text-xs text-gray-400">
            E-mail: <span className="text-brand-600 font-medium select-all">suporte@producaonamao.com.br</span>
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Para fazer upgrade ou cancelar, envie e-mail para:{" "}
          <span className="text-brand-600 font-medium select-all">suporte@producaonamao.com.br</span>
          {" "}com o assunto <strong>"Alteração de plano"</strong>.
        </p>
      </div>

      {/* Alterar senha */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-brand-500" />
          <h3 className="font-semibold">Alterar senha</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input
              className="input"
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              className="input"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              className="input"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          <button onClick={changePassword} disabled={savingPw} className="btn-primary">
            {savingPw ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      </div>

      {/* Restaurante */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-brand-500" />
          <h3 className="font-semibold">Meu restaurante</h3>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="text-gray-400">Nome:</span> {user?.tenant_name}</p>
          <p><span className="text-gray-400">Perfil:</span> <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>

      {/* LGPD */}
      <div className="card border-gray-100">
        <h3 className="font-semibold mb-3 text-gray-700">Privacidade e dados (LGPD)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem o direito
          de exportar ou excluir todos os seus dados pessoais.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={requestDataExport}
            className="btn-secondary text-sm"
          >
            Exportar meus dados
          </button>
          <button
            onClick={requestAccountDeletion}
            className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Excluir minha conta
          </button>
        </div>
      </div>
    </div>
  );
}
