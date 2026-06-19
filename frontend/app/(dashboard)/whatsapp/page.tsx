"use client";
import { useState } from "react";
import { api, productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Smartphone, Send, Settings2, Info } from "lucide-react";

export default function WhatsAppPage() {
  const [config, setConfig] = useState({
    provider: "evolution_api",
    api_url: "",
    api_key: "",
    instance_name: "",
    phone_number: "",
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

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
      setProducts(Array.isArray(data) ? data : data.items || []);
    } catch {
      toast.error("Erro ao buscar produtos");
    } finally {
      setSearching(false);
    }
  }

  async function saveConfig() {
    if (!config.api_url.trim()) return toast.error("Informe a URL da API");
    if (!config.api_key.trim()) return toast.error("Informe a chave de API");
    setSavingConfig(true);
    try {
      await api.post("/api/v1/whatsapp/config", config);
      toast.success("Configuração salva!");
      setConfigSaved(true);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erro ao salvar configuração");
    } finally {
      setSavingConfig(false);
    }
  }

  async function sendFicha() {
    if (!selectedProduct) return toast.error("Selecione um produto");
    if (!sendPhone.trim()) return toast.error("Informe o número do WhatsApp");
    setSending(true);
    try {
      await api.post("/api/v1/whatsapp/send-ficha", {
        product_id: selectedProduct.id,
        phone: sendPhone.replace(/\D/g, ""),
      });
      toast.success("Ficha técnica enviada!");
      setSelectedProduct(null);
      setProductSearch("");
      setSendPhone("");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erro ao enviar. Verifique a configuração.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">WhatsApp</h2>
        <p className="text-gray-500 text-sm">Envie fichas técnicas para a cozinha via WhatsApp</p>
      </div>

      {/* Como testar */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
        <p className="font-semibold flex items-center gap-2"><Info size={15} />Como conectar o WhatsApp</p>
        <p>O sistema usa a <strong>Evolution API</strong> (gratuita e open-source) para enviar mensagens. Siga os passos:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2 text-blue-700">
          <li>Acesse <strong>evolution-api.com</strong> ou instale no servidor</li>
          <li>Crie uma instância e escaneie o QR Code com seu WhatsApp</li>
          <li>Copie a <strong>API URL</strong> e a <strong>API Key</strong></li>
          <li>Cole os dados abaixo e clique em Salvar</li>
        </ol>
        <p className="text-xs text-blue-600 mt-1">
          Alternativa mais simples: use o <strong>Z-API</strong> (z-api.io) — tem plano gratuito para testes.
        </p>
      </div>

      {/* Configuração */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={18} className="text-brand-500" />
          <h3 className="font-semibold">Configuração da integração</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provedor</label>
            <select
              className="input"
              value={config.provider}
              onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value }))}
            >
              <option value="evolution_api">Evolution API (recomendado)</option>
              <option value="z_api">Z-API</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da API *</label>
            <input
              className="input"
              placeholder="https://api.seuservidor.com"
              value={config.api_url}
              onChange={(e) => setConfig((c) => ({ ...c, api_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave de API (API Key) *</label>
            <input
              className="input"
              type="password"
              placeholder="Sua chave de autenticação"
              value={config.api_key}
              onChange={(e) => setConfig((c) => ({ ...c, api_key: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da instância</label>
              <input
                className="input"
                placeholder="Ex: producao-na-mao"
                value={config.instance_name}
                onChange={(e) => setConfig((c) => ({ ...c, instance_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do restaurante</label>
              <input
                className="input"
                placeholder="5511999999999"
                value={config.phone_number}
                onChange={(e) => setConfig((c) => ({ ...c, phone_number: e.target.value }))}
              />
            </div>
          </div>
          <button onClick={saveConfig} disabled={savingConfig} className="btn-primary w-full">
            {savingConfig ? "Salvando..." : "Salvar configuração"}
          </button>
          {configSaved && (
            <p className="text-xs text-green-600 text-center">Configuração salva. Agora teste enviando uma ficha abaixo.</p>
          )}
        </div>
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
                onChange={(e) => { setProductSearch(e.target.value); if (!e.target.value) setProducts([]); }}
                onKeyDown={(e) => e.key === "Enter" && searchProducts()}
              />
              <button onClick={searchProducts} disabled={searching} className="btn-secondary px-4">
                {searching ? "..." : "Buscar"}
              </button>
            </div>
          </div>

          {products.length > 0 && (
            <div className="border rounded-xl overflow-hidden divide-y">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setProducts([]); setProductSearch(p.name); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm">
              Produto selecionado: <strong>{selectedProduct.name}</strong>
              <button onClick={() => { setSelectedProduct(null); setProductSearch(""); }} className="ml-2 text-gray-400 hover:text-red-400 text-xs underline">remover</button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enviar para (WhatsApp com DDI+DDD)
            </label>
            <input
              className="input"
              placeholder="5511999999999"
              value={sendPhone}
              onChange={(e) => setSendPhone(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Ex: 5511998887766 (55 = Brasil, 11 = DDD, sem espaços ou traços)</p>
          </div>

          <button
            onClick={sendFicha}
            disabled={sending || !selectedProduct || !sendPhone}
            className="btn-primary w-full"
          >
            {sending ? "Enviando..." : "Enviar ficha técnica via WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
