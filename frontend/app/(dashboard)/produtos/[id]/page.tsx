"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productsApi, recipesApi, whatsappApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AIConsultant from "@/components/chat/AIConsultant";
import toast from "react-hot-toast";
import { ChefHat, Send, Edit, MessageCircle, X } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [recipe, setRecipe] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const isAdmin = user?.role !== "user";

  useEffect(() => {
    productsApi.get(id).then((r) => { setProduct(r.data); setNewPrice(r.data.selling_price || ""); });
    recipesApi.getByProduct(id).then((r) => setRecipe(r.data)).catch(() => {});
  }, [id]);

  async function savePrice() {
    try {
      await productsApi.updatePrice(id, parseFloat(newPrice));
      setProduct((p: any) => ({ ...p, selling_price: parseFloat(newPrice) }));
      setEditingPrice(false);
      toast.success("Preço atualizado!");
    } catch {
      toast.error("Erro ao atualizar preço");
    }
  }

  async function sendFicha() {
    const phone = prompt("Digite o número WhatsApp (com DDD, sem +55):");
    if (!phone) return;
    try {
      await whatsappApi.sendFicha(id, phone);
      toast.success("Ficha técnica enviada!");
    } catch {
      toast.error("Erro ao enviar. Verifique a configuração do WhatsApp.");
    }
  }

  if (!product) return <div className="text-center py-20 text-gray-500">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho do produto */}
      <div className="card flex gap-6">
        {product.photo_url && (
          <img src={product.photo_url} alt={product.name} className="w-32 h-32 rounded-xl object-cover" />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              {product.abc_curve && (
                <span className={`badge-${product.abc_curve.toLowerCase()} mt-1`}>Curva {product.abc_curve}</span>
              )}
              {product.description && <p className="text-gray-500 text-sm mt-2">{product.description}</p>}
            </div>
            <div className="text-right">
              {editingPrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">R$</span>
                  <input className="input w-24 text-right" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} autoFocus />
                  <button onClick={savePrice} className="btn-primary text-xs px-3 py-1.5">Salvar</button>
                  <button onClick={() => setEditingPrice(false)} className="btn-secondary text-xs px-3 py-1.5">×</button>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-brand-600">R$ {parseFloat(product.selling_price || 0).toFixed(2).replace(".", ",")}</p>
                  <button onClick={() => setEditingPrice(true)} className="text-xs text-gray-400 hover:text-brand-500 underline mt-1">
                    <Edit size={12} className="inline mr-1" />Editar preço
                  </button>
                </div>
              )}
              {isAdmin && product.suggested_price && (
                <p className="text-xs text-gray-500 mt-1">Sugerido: R$ {parseFloat(product.suggested_price).toFixed(2).replace(".", ",")}</p>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2 mt-4 text-sm">
              {product.cmv_value && <span className="bg-gray-100 rounded px-2 py-1">CMV: R$ {parseFloat(product.cmv_value).toFixed(2)} ({product.cmv_percentage}%)</span>}
              {product.gross_margin && <span className={`rounded px-2 py-1 ${parseFloat(product.gross_margin) < 50 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>Margem: {product.gross_margin}%</span>}
            </div>
          )}
        </div>
      </div>

      {/* Modo de preparo */}
      {product.preparation_method && (
        <div className="card">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><ChefHat size={18} className="text-brand-500" />Modo de Preparo</h3>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {product.preparation_method}
          </div>
        </div>
      )}

      {/* Ficha técnica */}
      {recipe && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Ficha Técnica — Ingredientes</h3>
            <div className="flex gap-2">
              <button onClick={sendFicha} className="btn-secondary text-xs flex items-center gap-1">
                <Send size={12} />Enviar WhatsApp
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">Rendimento: {recipe.yield_quantity} {recipe.yield_unit}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Ingrediente</th>
                  <th className="pb-2 font-medium text-right">Qtd.</th>
                  <th className="pb-2 font-medium">Un.</th>
                  <th className="pb-2 font-medium text-right">% Perda</th>
                  {isAdmin && <th className="pb-2 font-medium text-right">Custo linha</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipe.ingredients.map((ing: any) => (
                  <tr key={ing.id}>
                    <td className="py-2 font-medium">{ing.ingredient_name}</td>
                    <td className="py-2 text-right text-gray-600">{ing.quantity}</td>
                    <td className="py-2 text-gray-500">{ing.unit_of_measure}</td>
                    <td className="py-2 text-right text-gray-500">{ing.waste_percentage > 0 ? `${ing.waste_percentage}%` : "—"}</td>
                    {isAdmin && <td className="py-2 text-right font-mono">R$ {parseFloat(ing.line_cost).toFixed(4)}</td>}
                  </tr>
                ))}
              </tbody>
              {isAdmin && (
                <tfoot className="border-t-2 font-semibold">
                  <tr>
                    <td colSpan={4} className="pt-2">Total</td>
                    <td className="pt-2 text-right font-mono text-brand-600">R$ {parseFloat(recipe.total_cost).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-gray-500 font-normal text-xs">Custo / unidade</td>
                    <td className="text-right font-mono text-gray-600 text-xs">R$ {parseFloat(recipe.cost_per_unit).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {recipe.notes && <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">📝 {recipe.notes}</p>}
        </div>
      )}

      {/* Botão flutuante do consultor IA */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors z-40"
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
