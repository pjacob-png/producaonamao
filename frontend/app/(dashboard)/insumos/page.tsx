"use client";
import { useEffect, useState } from "react";
import { ingredientsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, Search, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function InsumosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "user";
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", category: "", unit_of_measure: "kg", unit_cost: "", supplier: "" });

  const units = ["kg", "g", "L", "ml", "un", "cx", "pc", "pct"];

  useEffect(() => {
    load();
  }, [search]);

  function load() {
    setLoading(true);
    ingredientsApi.list({ search: search || undefined })
      .then((r) => setIngredients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function save() {
    if (!form.name || !form.unit_cost) return toast.error("Preencha nome e custo unitário");
    const payload = { ...form, unit_cost: parseFloat(form.unit_cost) };
    try {
      if (editingId) {
        await ingredientsApi.update(editingId, payload);
        toast.success("Insumo atualizado!");
      } else {
        await ingredientsApi.create(payload);
        toast.success("Insumo criado!");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ code: "", name: "", category: "", unit_of_measure: "kg", unit_cost: "", supplier: "" });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erro ao salvar");
    }
  }

  function startEdit(ing: any) {
    setForm({ code: ing.code || "", name: ing.name, category: ing.category || "", unit_of_measure: ing.unit_of_measure, unit_cost: ing.unit_cost, supplier: ing.supplier || "" });
    setEditingId(ing.id);
    setShowForm(true);
  }

  async function remove(id: string) {
    if (!confirm("Desativar este insumo?")) return;
    try { await ingredientsApi.remove(id); toast.success("Insumo desativado"); load(); }
    catch { toast.error("Erro ao remover"); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{ingredients.length} insumo(s)</p>
        {isAdmin && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ code: "", name: "", category: "", unit_of_measure: "kg", unit_cost: "", supplier: "" }); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Novo insumo
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar insumo..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Formulário inline */}
      {showForm && isAdmin && (
        <div className="card border-brand-200 bg-orange-50 space-y-3">
          <h3 className="font-semibold text-sm">{editingId ? "Editar insumo" : "Novo insumo"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Código</label><input className="input text-sm" placeholder="001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Nome *</label><input className="input text-sm" placeholder="Farinha de trigo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Categoria</label><input className="input text-sm" placeholder="Secos" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Unidade *</label>
              <select className="input text-sm" value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Custo unitário (R$) *</label><input className="input text-sm" type="number" step="0.0001" placeholder="0,0000" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Fornecedor</label><input className="input text-sm" placeholder="Atacado X" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="btn-primary text-sm flex items-center gap-1"><Check size={14} /> Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Cód.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Un.</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Custo unitário</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Fornecedor</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ingredients.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Nenhum insumo cadastrado.</td></tr>
              )}
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{ing.code || "—"}</td>
                  <td className="px-4 py-3 font-medium">{ing.name}</td>
                  <td className="px-4 py-3 text-gray-500">{ing.category || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{ing.unit_of_measure}</td>
                  <td className="px-4 py-3 text-right font-mono">R$ {parseFloat(ing.unit_cost).toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ing.supplier || "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => startEdit(ing)} className="text-gray-400 hover:text-brand-500"><Pencil size={14} /></button>
                        <button onClick={() => remove(ing.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
