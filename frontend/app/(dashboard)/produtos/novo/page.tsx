"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { productsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    preparation_method: "",
    selling_price: "",
    abc_curve: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nome do produto é obrigatório");

    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        preparation_method: form.preparation_method.trim() || null,
        abc_curve: form.abc_curve || null,
        selling_price: form.selling_price ? parseFloat(form.selling_price.replace(",", ".")) : null,
      };

      const { data } = await productsApi.create(payload);
      toast.success("Produto criado com sucesso!");
      router.push(`/produtos/${data.id}`);
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (Array.isArray(detail)) toast.error(detail[0]?.msg || "Erro ao criar produto");
      else toast.error(detail || "Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/produtos" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold">Novo produto</h2>
          <p className="text-gray-500 text-sm">Cadastre um produto do seu cardápio</p>
        </div>
      </div>

      <form onSubmit={submit} className="card space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do produto <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ex: X-Burguer Especial"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código interno
            </label>
            <input
              className="input"
              placeholder="Ex: XB001"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Opcional — código do seu sistema ou cardápio</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço de venda (R$)
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 29,90"
              value={form.selling_price}
              onChange={(e) => set("selling_price", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Pode ser definido depois na ficha técnica</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curva ABC
            </label>
            <select
              className="input"
              value={form.abc_curve}
              onChange={(e) => set("abc_curve", e.target.value)}
            >
              <option value="">Não classificado</option>
              <option value="A">A — Mais vendido (prioridade alta)</option>
              <option value="B">B — Venda média</option>
              <option value="C">C — Venda baixa</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Descreva o produto brevemente (aparece no cardápio)"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modo de preparo
            </label>
            <textarea
              className="input resize-none"
              rows={5}
              placeholder="Descreva o passo a passo do preparo..."
              value={form.preparation_method}
              onChange={(e) => set("preparation_method", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Pode adicionar ou editar depois na ficha técnica</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/produtos" className="btn-secondary flex-1 text-center">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "Criando..." : "Criar produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
