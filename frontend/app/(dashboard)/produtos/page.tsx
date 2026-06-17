"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, Search, ChefHat } from "lucide-react";

export default function ProdutosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "user";
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [curva, setCurva] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productsApi.list({ search: search || undefined, abc_curve: curva || undefined })
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, curva]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{products.length} produto(s)</p>
        {isAdmin && (
          <Link href="/produtos/novo" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Novo produto
          </Link>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={curva} onChange={(e) => setCurva(e.target.value)}>
          <option value="">Todas curvas</option>
          <option value="A">Curva A</option>
          <option value="B">Curva B</option>
          <option value="C">Curva C</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <ChefHat size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum produto encontrado.</p>
          {isAdmin && <Link href="/produtos/novo" className="btn-primary inline-block mt-4 text-sm">Cadastrar primeiro produto</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/produtos/${p.id}`} className="card hover:shadow-md transition-shadow cursor-pointer group">
              {p.photo_url && (
                <img src={p.photo_url} alt={p.name} className="w-full h-36 object-cover rounded-lg mb-3" />
              )}
              {!p.photo_url && (
                <div className="w-full h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg mb-3 flex items-center justify-center">
                  <ChefHat size={32} className="text-brand-300" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>}
                </div>
                {p.abc_curve && (
                  <span className={`badge-${p.abc_curve.toLowerCase()} ml-2 shrink-0`}>{p.abc_curve}</span>
                )}
              </div>
              {p.selling_price && (
                <p className="text-brand-600 font-bold text-lg mt-2">
                  R$ {parseFloat(p.selling_price).toFixed(2).replace(".", ",")}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
