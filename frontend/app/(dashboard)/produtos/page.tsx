"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { productsApi, importsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, Search, ChefHat, Download, Upload, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function ProdutosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "user";
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [curva, setCurva] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ criados: number; erros: any[] } | null>(null);

  function load() {
    setLoading(true);
    productsApi.list({ search: search || undefined, abc_curve: curva || undefined })
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, curva]);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportResult(null);
    try {
      const r = await importsApi.importProducts(file);
      setImportResult(r.data);
      if (r.data.criados > 0) {
        toast.success(`${r.data.criados} produto(s) importado(s)!`);
        load();
      }
      if (r.data.erros.length > 0 && r.data.criados === 0) {
        toast.error("Nenhum produto importado — verifique os erros abaixo");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erro ao importar arquivo");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-gray-500 text-sm">{products.length} produto(s)</p>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => importsApi.downloadProductTemplate().catch(() => toast.error("Erro ao baixar modelo"))}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Download size={15} /> Exportar modelo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Upload size={15} /> {importing ? "Importando..." : "Importar Excel"}
            </button>
            <Link href="/produtos/novo" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Novo produto
            </Link>
          </div>
        )}
      </div>

      {importResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm space-y-2 ${importResult.erros.length > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>
          <p className="font-semibold">
            {importResult.criados > 0 && <span className="text-green-700">{importResult.criados} produto(s) criado(s). </span>}
            {importResult.erros.length > 0 && (
              <span className="text-yellow-700 flex items-center gap-1">
                <AlertTriangle size={14} />{importResult.erros.length} erro(s) encontrado(s):
              </span>
            )}
          </p>
          {importResult.erros.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 text-yellow-800 max-h-40 overflow-y-auto">
              {importResult.erros.map((e, i) => (
                <li key={i}>Linha {e.linha}: {e.erro}</li>
              ))}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} className="text-xs text-gray-400 underline">Fechar</button>
        </div>
      )}

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
