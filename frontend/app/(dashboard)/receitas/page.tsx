"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { productsApi, recipesApi } from "@/lib/api";
import { BookOpen, Search } from "lucide-react";

export default function ReceitasPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list({ search: search || undefined })
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-5">
      <p className="text-gray-500 text-sm">Selecione um produto para ver ou editar sua ficha técnica.</p>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <Link key={p.id} href={`/produtos/${p.id}`} className="card hover:shadow-md transition-shadow flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm group-hover:text-brand-600 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.abc_curve ? `Curva ${p.abc_curve}` : "Sem curva"}</p>
              </div>
              {p.abc_curve && <span className={`badge-${p.abc_curve.toLowerCase()}`}>{p.abc_curve}</span>}
            </Link>
          ))}
          {products.length === 0 && (
            <div className="col-span-3 card text-center py-12 text-gray-400">Nenhum produto encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
