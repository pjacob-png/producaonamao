"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productsApi, recipesApi, ingredientsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AIConsultant from "@/components/chat/AIConsultant";
import toast from "react-hot-toast";
import { ChefHat, Edit2, MessageCircle, Plus, Trash2, Save, X, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

// ── tipos locais ─────────────────────────────────────────────────────────────
interface IngRow { ingredient_id: string; quantity: string; unit_of_measure: string; waste_percentage: string; }
const emptyRow = (): IngRow => ({ ingredient_id: "", quantity: "", unit_of_measure: "kg", waste_percentage: "0" });

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role !== "user";

  // dados
  const [product, setProduct] = useState<any>(null);
  const [recipe, setRecipe]   = useState<any>(null);
  const [allIngredients, setAllIngredients] = useState<any[]>([]);

  // modos de edição
  const [editProduct, setEditProduct] = useState(false);
  const [editRecipe,  setEditRecipe]  = useState(false);
  const [showChat,    setShowChat]    = useState(false);

  // formulário produto
  const [pForm, setPForm] = useState({ name: "", description: "", preparation_method: "", abc_curve: "", selling_price: "" });

  // formulário ficha técnica
  const [yieldQty,  setYieldQty]  = useState("1");
  const [yieldUnit, setYieldUnit] = useState("un");
  const [notes,     setNotes]     = useState("");
  const [rows,      setRows]      = useState<IngRow[]>([emptyRow()]);

  const [saving, setSaving] = useState(false);

  // ── carrega dados ──────────────────────────────────────────────────────────
  useEffect(() => {
    productsApi.get(id).then((r) => {
      setProduct(r.data);
      setPForm({
        name: r.data.name || "",
        description: r.data.description || "",
        preparation_method: r.data.preparation_method || "",
        abc_curve: r.data.abc_curve || "",
        selling_price: r.data.selling_price ? String(parseFloat(r.data.selling_price)) : "",
      });
    });
    recipesApi.getByProduct(id).then((r) => {
      setRecipe(r.data);
      setYieldQty(String(r.data.yield_quantity));
      setYieldUnit(r.data.yield_unit);
      setNotes(r.data.notes || "");
      setRows(r.data.ingredients.map((i: any) => ({
        ingredient_id: String(i.ingredient_id),
        quantity: String(i.quantity),
        unit_of_measure: i.unit_of_measure,
        waste_percentage: String(i.waste_percentage),
      })));
    }).catch(() => {});
    ingredientsApi.list().then((r) => setAllIngredients(r.data)).catch(() => {});
  }, [id]);

  // ── salva produto ──────────────────────────────────────────────────────────
  async function saveProduct() {
    if (!pForm.name.trim()) return toast.error("Nome é obrigatório");
    setSaving(true);
    try {
      const body: any = {
        name: pForm.name.trim(),
        description: pForm.description.trim() || null,
        preparation_method: pForm.preparation_method.trim() || null,
        abc_curve: pForm.abc_curve || null,
      };
      await productsApi.update(id, body);
      if (pForm.selling_price) {
        await productsApi.updatePrice(id, parseFloat(pForm.selling_price.replace(",", ".")));
      }
      const r = await productsApi.get(id);
      setProduct(r.data);
      setEditProduct(false);
      toast.success("Produto atualizado!");
    } catch {
      toast.error("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  // ── salva ficha técnica ────────────────────────────────────────────────────
  async function saveRecipe() {
    const validRows = rows.filter((r) => r.ingredient_id && parseFloat(r.quantity) > 0);
    if (validRows.length === 0) return toast.error("Adicione pelo menos um insumo");

    const payload = {
      product_id: id,
      yield_quantity: parseFloat(yieldQty) || 1,
      yield_unit: yieldUnit,
      notes: notes.trim() || null,
      ingredients: validRows.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity: parseFloat(r.quantity),
        unit_of_measure: r.unit_of_measure,
        waste_percentage: parseFloat(r.waste_percentage) || 0,
      })),
    };

    setSaving(true);
    try {
      let r;
      if (recipe) {
        r = await recipesApi.update(recipe.id, payload);
      } else {
        r = await recipesApi.create(payload);
      }
      setRecipe(r.data);
      setEditRecipe(false);
      // Recarrega produto para pegar CMV e preço sugerido atualizados
      const pr = await productsApi.get(id);
      setProduct(pr.data);
      toast.success(recipe ? "Ficha técnica atualizada!" : "Ficha técnica criada!");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erro ao salvar ficha técnica");
    } finally {
      setSaving(false);
    }
  }

  function updateRow(i: number, field: keyof IngRow, val: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }
  function addRow() { setRows((prev) => [...prev, emptyRow()]); }
  function removeRow(i: number) { setRows((prev) => prev.filter((_, idx) => idx !== i)); }

  if (!product) return <div className="text-center py-20 text-gray-400">Carregando...</div>;

  const cmvPct    = product.cmv_percentage  != null ? parseFloat(product.cmv_percentage)  : null;
  const margin    = product.gross_margin    != null ? parseFloat(product.gross_margin)     : null;
  const suggested = product.suggested_price != null ? parseFloat(product.suggested_price) : null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/produtos" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></Link>
        <span className="text-gray-400 text-sm">Produtos</span>
        <span className="text-gray-300 text-sm">/</span>
        <span className="text-sm font-medium text-gray-700 truncate">{product.name}</span>
      </div>

      {/* ── Card produto ────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {!editProduct ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  {product.abc_curve && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${product.abc_curve === "A" ? "bg-green-500" : product.abc_curve === "B" ? "bg-orange-500" : "bg-gray-400"}`}>
                      Curva {product.abc_curve}
                    </span>
                  )}
                </div>
                {product.description && <p className="text-gray-500 text-sm mt-1">{product.description}</p>}
              </>
            ) : (
              <div className="space-y-3 w-full">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
                  <input className="input" value={pForm.name} onChange={(e) => setPForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Curva ABC</label>
                    <select className="input" value={pForm.abc_curve} onChange={(e) => setPForm(f => ({ ...f, abc_curve: e.target.value }))}>
                      <option value="">Não classificado</option>
                      <option value="A">A — Mais vendido</option>
                      <option value="B">B — Médio</option>
                      <option value="C">C — Baixo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Preço de venda (R$)</label>
                    <input className="input" type="number" step="0.01" min="0" value={pForm.selling_price} onChange={(e) => setPForm(f => ({ ...f, selling_price: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descrição</label>
                  <textarea className="input resize-none" rows={2} value={pForm.description} onChange={(e) => setPForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Modo de preparo</label>
                  <textarea className="input resize-none" rows={5} placeholder="Passo a passo do preparo..." value={pForm.preparation_method} onChange={(e) => setPForm(f => ({ ...f, preparation_method: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditProduct(false)} className="btn-secondary flex-1"><X size={14} className="inline mr-1" />Cancelar</button>
                  <button onClick={saveProduct} disabled={saving} className="btn-primary flex-1"><Save size={14} className="inline mr-1" />{saving ? "Salvando..." : "Salvar"}</button>
                </div>
              </div>
            )}
          </div>

          {/* Preço + ações */}
          {!editProduct && (
            <div className="text-right shrink-0 space-y-2">
              <p className="text-3xl font-bold text-brand-600">
                R$ {parseFloat(product.selling_price || 0).toFixed(2).replace(".", ",")}
              </p>
              {isAdmin && (
                <button onClick={() => setEditProduct(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 underline ml-auto">
                  <Edit2 size={12} />Editar produto
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modo de preparo (leitura) */}
        {!editProduct && product.preparation_method && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><ChefHat size={12} />Modo de preparo</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{product.preparation_method}</p>
          </div>
        )}
      </div>

      {/* ── CMV e Preço sugerido ────────────────────────────────────────────── */}
      {isAdmin && product.cmv_value != null && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-400">Custo da receita</p>
            <p className="text-lg font-bold mt-1">R$ {parseFloat(product.cmv_value).toFixed(2).replace(".", ",")}</p>
          </div>
          {cmvPct !== null && (
            <div className={`card text-center ${cmvPct > 40 ? "border-red-200 bg-red-50" : cmvPct > 30 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}`}>
              <p className="text-xs text-gray-400">CMV</p>
              <p className={`text-lg font-bold mt-1 ${cmvPct > 40 ? "text-red-600" : cmvPct > 30 ? "text-orange-600" : "text-green-600"}`}>{cmvPct.toFixed(1)}%</p>
            </div>
          )}
          {margin !== null && (
            <div className={`card text-center ${margin < 50 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}`}>
              <p className="text-xs text-gray-400">Margem bruta</p>
              <p className={`text-lg font-bold mt-1 ${margin < 50 ? "text-orange-600" : "text-green-600"}`}>{margin.toFixed(1)}%</p>
            </div>
          )}
          {suggested !== null ? (
            <div className="card text-center border-brand-200 bg-orange-50">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><TrendingUp size={10} />Preço sugerido</p>
              <p className="text-lg font-bold mt-1 text-brand-600">R$ {suggested.toFixed(2).replace(".", ",")}</p>
              <p className="text-xs text-gray-400 mt-1">(markup configurado)</p>
            </div>
          ) : (
            <div className="card text-center border-dashed border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><TrendingUp size={10} />Preço sugerido</p>
              <p className="text-xs text-gray-400 mt-2">Configure uma regra em</p>
              <Link href="/markup" className="text-xs text-brand-500 underline">Markup & Preços</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Ficha técnica ───────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Ficha Técnica — Insumos</h3>
            {!editRecipe && (
              <button onClick={() => setEditRecipe(true)} className="btn-secondary text-xs flex items-center gap-1">
                <Edit2 size={12} />{recipe ? "Editar ficha" : "Criar ficha técnica"}
              </button>
            )}
          </div>

          {/* Visualização */}
          {!editRecipe && recipe && (
            <>
              <p className="text-sm text-gray-500 mb-3">Rendimento: {recipe.yield_quantity} {recipe.yield_unit}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-400">
                      <th className="pb-2 font-medium">Insumo</th>
                      <th className="pb-2 font-medium text-right">Qtd.</th>
                      <th className="pb-2 font-medium">Un.</th>
                      <th className="pb-2 font-medium text-right">Perda</th>
                      <th className="pb-2 font-medium text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recipe.ingredients.map((ing: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 font-medium text-gray-800">{ing.ingredient_name}</td>
                        <td className="py-2 text-right text-gray-600">{ing.quantity}</td>
                        <td className="py-2 text-gray-500">{ing.unit_of_measure}</td>
                        <td className="py-2 text-right text-gray-400">{parseFloat(ing.waste_percentage) > 0 ? `${ing.waste_percentage}%` : "—"}</td>
                        <td className="py-2 text-right font-mono text-gray-700">R$ {parseFloat(ing.line_cost).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2">
                    <tr>
                      <td colSpan={4} className="pt-2 font-semibold">Total</td>
                      <td className="pt-2 text-right font-mono font-bold text-brand-600">R$ {parseFloat(recipe.total_cost).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-xs text-gray-400">Custo por unidade</td>
                      <td className="text-right font-mono text-xs text-gray-500">R$ {parseFloat(recipe.cost_per_unit).toFixed(4)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {recipe.notes && <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">Obs: {recipe.notes}</p>}
            </>
          )}

          {!editRecipe && !recipe && (
            <div className="text-center py-10 text-gray-400">
              <ChefHat size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Nenhuma ficha técnica cadastrada.</p>
              <p className="text-xs mt-1">Clique em "Criar ficha técnica" para adicionar os insumos e calcular o CMV.</p>
            </div>
          )}

          {/* Formulário de edição */}
          {editRecipe && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rendimento (quantidade)</label>
                  <input className="input" type="number" step="0.01" min="0.01" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unidade de rendimento</label>
                  <select className="input" value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)}>
                    <option value="un">un (unidade)</option>
                    <option value="porcao">porção</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L (litro)</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insumos</label>
                  <button type="button" onClick={addRow} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    <Plus size={12} />Adicionar insumo
                  </button>
                </div>

                <div className="space-y-2">
                  {/* cabeçalho */}
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1">
                    <span className="col-span-4">Insumo *</span>
                    <span className="col-span-2 text-right">Qtd. *</span>
                    <span className="col-span-3">Unidade</span>
                    <span className="col-span-2 text-right">% Perda</span>
                    <span className="col-span-1"></span>
                  </div>

                  {rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        className="input col-span-4 text-sm"
                        value={row.ingredient_id}
                        onChange={(e) => updateRow(i, "ingredient_id", e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {allIngredients.map((ing: any) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit_of_measure}) — R${parseFloat(ing.unit_cost).toFixed(4)}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input col-span-2 text-right"
                        type="number" step="0.001" min="0"
                        placeholder="0"
                        value={row.quantity}
                        onChange={(e) => updateRow(i, "quantity", e.target.value)}
                      />
                      <select
                        className="input col-span-3 text-sm"
                        value={row.unit_of_measure}
                        onChange={(e) => updateRow(i, "unit_of_measure", e.target.value)}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                        <option value="porcao">porção</option>
                        <option value="cx">cx</option>
                        <option value="pct">pct</option>
                      </select>
                      <input
                        className="input col-span-2 text-right"
                        type="number" step="0.1" min="0" max="99"
                        placeholder="0"
                        value={row.waste_percentage}
                        onChange={(e) => updateRow(i, "waste_percentage", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="col-span-1 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {allIngredients.length === 0 && (
                  <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-3 mt-2">
                    Nenhum insumo cadastrado.{" "}
                    <Link href="/insumos" className="underline font-medium">Cadastre insumos primeiro</Link>
                    {" "}antes de criar a ficha técnica.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Observações</label>
                <textarea className="input resize-none text-sm" rows={2} placeholder="Ex: servir imediatamente, validade 2 dias..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditRecipe(false)} className="btn-secondary flex-1"><X size={14} className="inline mr-1" />Cancelar</button>
                <button onClick={saveRecipe} disabled={saving} className="btn-primary flex-1">
                  <Save size={14} className="inline mr-1" />{saving ? "Salvando..." : recipe ? "Salvar ficha" : "Criar ficha"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Botão IA ────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors z-40"
        title="Chef Consultor IA"
      >
        <MessageCircle size={22} />
      </button>

      {showChat && (
        <div className="fixed inset-y-0 right-0 w-96 z-50 shadow-2xl">
          <AIConsultant onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  );
}
