"use client";
import { useEffect, useState } from "react";
import { markupApi } from "@/lib/api";
import { Plus, Trash2, TrendingUp, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";

export default function MarkupPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [tab, setTab] = useState<"rules" | "prices" | "promos">("rules");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", applies_to: "global", markup_type: "percentage_over_cost", markup_value: "", priority: "0", abc_curve: "" });

  useEffect(() => {
    markupApi.listRules().then((r) => setRules(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "prices" && prices.length === 0)
      markupApi.suggestPrices().then((r) => setPrices(r.data)).catch(() => {});
    if (tab === "promos" && promos.length === 0)
      markupApi.promotions().then((r) => setPromos(r.data)).catch(() => {});
  }, [tab]);

  async function saveRule() {
    if (!form.name || !form.markup_value) return toast.error("Preencha nome e valor");
    try {
      await markupApi.createRule({ ...form, markup_value: parseFloat(form.markup_value), priority: parseInt(form.priority) });
      toast.success("Regra criada!");
      setShowForm(false);
      markupApi.listRules().then((r) => setRules(r.data));
    } catch (e: any) { toast.error(e.response?.data?.detail || "Erro"); }
  }

  async function deleteRule(id: string) {
    if (!confirm("Remover esta regra?")) return;
    await markupApi.deleteRule(id);
    setRules((r) => r.filter((x) => x.id !== id));
    toast.success("Regra removida");
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["rules", "prices", "promos"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
            {t === "rules" ? "Regras de Markup" : t === "prices" ? "Preços Sugeridos" : "Sugestões Promo"}
          </button>
        ))}
      </div>

      {tab === "rules" && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Nova regra</button>
          {showForm && (
            <div className="card border-brand-200 bg-orange-50 space-y-3">
              <h3 className="font-semibold text-sm">Nova regra de markup</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Nome da regra</label><input className="input text-sm" placeholder="Markup padrão" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Aplica-se a</label>
                  <select className="input text-sm" value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}>
                    <option value="global">Global (todos os produtos)</option>
                    <option value="curve">Curva ABC específica</option>
                    <option value="category">Categoria específica</option>
                  </select>
                </div>
                {form.applies_to === "curve" && (
                  <div><label className="block text-xs text-gray-500 mb-1">Curva</label>
                    <select className="input text-sm" value={form.abc_curve} onChange={(e) => setForm({ ...form, abc_curve: e.target.value })}>
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                    </select>
                  </div>
                )}
                <div><label className="block text-xs text-gray-500 mb-1">Tipo de markup</label>
                  <select className="input text-sm" value={form.markup_type} onChange={(e) => setForm({ ...form, markup_type: e.target.value })}>
                    <option value="percentage_over_cost">% sobre custo (ex: 300% = 3x o custo)</option>
                    <option value="target_margin">Margem alvo % (ex: 70% = margem de 70%)</option>
                  </select>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Valor (%)</label><input className="input text-sm" type="number" placeholder="300" value={form.markup_value} onChange={(e) => setForm({ ...form, markup_value: e.target.value })} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Prioridade (maior = preferida)</label><input className="input text-sm" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveRule} className="btn-primary text-sm">Salvar</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="card flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-sm">{r.name}</span>
                  <span className="ml-3 text-xs text-gray-500">{r.applies_to === "global" ? "Global" : r.applies_to === "curve" ? `Curva ${r.abc_curve}` : "Por categoria"}</span>
                  <span className="ml-3 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{r.markup_type === "percentage_over_cost" ? `${r.markup_value}% s/ custo` : `Margem ${r.markup_value}%`}</span>
                  <span className="ml-2 text-xs text-gray-400">prioridade: {r.priority}</span>
                </div>
                <button onClick={() => deleteRule(r.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={15} /></button>
              </div>
            ))}
            {rules.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Nenhuma regra cadastrada.</p>}
          </div>
        </div>
      )}

      {tab === "prices" && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Produto</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">CMV</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Regra</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Preço sugerido</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {prices.map((p) => (
                <tr key={p.product_id}>
                  <td className="px-4 py-3 font-medium">{p.product_name}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">R$ {parseFloat(p.cmv_value).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.rule_applied}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-brand-600">R$ {parseFloat(p.suggested_price).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${parseFloat(p.gross_margin_pct) < 50 ? "text-red-500" : "text-green-600"}`}>{parseFloat(p.gross_margin_pct).toFixed(1)}%</td>
                </tr>
              ))}
              {prices.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Cadastre insumos e fichas técnicas para ver os preços sugeridos.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "promos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((p, i) => (
            <div key={i} className="card border-l-4 border-brand-400">
              <div className="flex items-start gap-2 mb-2">
                <Lightbulb size={16} className="text-brand-500 mt-0.5 shrink-0" />
                <h3 className="font-semibold text-sm">{p.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{p.description}</p>
              {p.products?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.products.map((prod: string, j: number) => (
                    <span key={j} className="text-xs bg-orange-50 text-brand-700 px-2 py-0.5 rounded-full">{prod}</span>
                  ))}
                </div>
              )}
              {p.estimated_margin && <p className="text-xs text-gray-400 mt-2 italic">{p.estimated_margin}</p>}
            </div>
          ))}
          {promos.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">Carregando sugestões...</p>}
        </div>
      )}
    </div>
  );
}
