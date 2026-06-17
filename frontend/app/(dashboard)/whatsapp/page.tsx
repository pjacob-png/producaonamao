"use client";
import { useState } from "react";
import { whatsappApi, productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Smartphone, Send, Settings2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function WhatsAppPage() {
  const { user } = useAuth();
  const isPro = user?.plan && user.plan !== "basic";

  const [config, setConfig] = useState({ phone: "", token: "" });
  const [savingConfig, setSavingConfig] = useState(false);

  const [sendPhone, setSendPhone] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  async function searchProducts() {
    if (!productSearch.trim()) return;
    setSearching(true);
    try {
      const { data } = await productsApi.list({ search: productSearch, limit: 10 });
      setProducts(data.items || data || []);
    } catch {
      toast.error("Erro ao buscar produtos");
    } finally {
      setSearching(false);
    }
  }

  async function saveConfig() {
    setSavingConfig(true);
    try {
      await whatsappApi.saveConfig(config);
      toast.success("Configuração salva!");
    } catch {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  }

  async function sendFicha() {
    if (!selectedProduct) return toast.error("Selecione um produto");
    if (!sendPhone.trim()) return toast.error("Informe o número do WhatsApp");
    setSending(true);
    try {
      await whatsappApi.sendFicha(selectedProduct.id, sendPhone);
      toast.success("Ficha técnica enviada!");
      setSelectedProduct(null);
      setSendPhone("");
    } catch {
      toast.error("Erro ao enviar ficha. Verifique a configuração do WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">WhatsApp</h2>
          <p className="text-gray-500 text-sm">Envie fichas técnicas e relatórios via WhatsApp</p>
        </div>
        <div className="card text-center py-14">
          <Smartphone size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Disponível nos planos Rede</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
            Envie fichas técnicas para a cozinha e relatórios diários direto no WhatsApp.
            Faça upgrade do seu plano para acessar esse recurso.
          </p>
          <a href="mailto:contato@producaonamao.com.br?subject=Upgrade de plano"
            className="btn-primary inline-block">
            Solicitar upgrade
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">WhatsApp</h2>
        <p className="text-gray-500 text-sm">Configure o número e envie fichas técnicas</p>
      </div>

      {/* Configuração */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={18} className="text-brand-500" />
          <h3 className="font-semibold">Configuração</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número WhatsApp do restaurante
            </label>
            <input
              className="input"
              placeholder="5511999999999 (com DDI e DDD)"
              value={config.phone}
              onChange={(e) => setConfig((c) => ({ ...c, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token de integração
            </label>
            <input
              className="input"
              type="password"
              placeholder="Token do provedor (ex: Twilio, Z-API)"
              value={config.token}
              onChange={(e) => setConfig((c) => ({ ...c, token: e.target.value }))}
            />
          </div>
        </div>
        <button onClick={saveConfig} disabled={savingConfig} className="btn-primary mt-4">
          {savingConfig ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>

      {/* Envio de ficha */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Send size={18} className="text-brand-500" />
          <h3 className="font-semibold">Enviar ficha técnica</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar produto</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Digite o nome do produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchProducts()}
              />
              <button onClick={searchProducts} disabled={searching} className="btn-secondary px-4">
                {searching ? "..." : "Buscar"}
              </button>
            </div>
          </div>

          {products.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setProducts([]); setProductSearch(p.name); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors border-b last:border-0 ${selectedProduct?.id === p.id ? "bg-orange-50 font-medium" : ""}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm">
              Selecionado: <strong>{selectedProduct.name}</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enviar para (WhatsApp)
            </label>
            <input
              className="input"
              placeholder="5511999999999"
              value={sendPhone}
              onChange={(e) => setSendPhone(e.target.value)}
            />
          </div>

          <button
            onClick={sendFicha}
            disabled={sending || !selectedProduct}
            className="btn-primary w-full"
          >
            {sending ? "Enviando..." : "Enviar ficha técnica"}
          </button>
        </div>
      </div>
    </div>
  );
}
