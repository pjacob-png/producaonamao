"use client";
import { useEffect, useState } from "react";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [abc, setAbc] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== "user") {
      reportsApi.cmvOverview().then((r) => setOverview(r.data)).catch(() => {});
      reportsApi.abcCurve().then((r) => setAbc(r.data)).catch(() => {});
    }
  }, [user]);

  const isAdmin = user?.role !== "user";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Olá, {user?.name?.split(" ")[0]}!</h2>
        <p className="text-gray-500 text-sm">{user?.tenant_name} — Painel de controle</p>
      </div>

      {isAdmin && overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Produtos com receita" value={overview.summary.total_products_with_recipe} />
          <StatCard label="CMV médio" value={`${overview.summary.avg_cmv_pct}%`} warn={overview.summary.avg_cmv_pct > 40} />
          <StatCard label="CMV acima de 40%" value={overview.summary.high_cmv_count} warn={overview.summary.high_cmv_count > 0} />
          <StatCard label="Preço abaixo do sugerido" value={overview.summary.products_below_suggested} warn />
        </div>
      )}

      {isAdmin && overview?.items && (
        <div className="card">
          <h3 className="font-semibold mb-4">CMV por produto (Top 10)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={overview.items.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="product_name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="cmv_pct" radius={[4, 4, 0, 0]}>
                {overview.items.slice(0, 10).map((item: any, i: number) => (
                  <Cell key={i} fill={item.cmv_pct > 40 ? "#ef4444" : item.cmv_pct > 30 ? "#f59e0b" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isAdmin && (
        <div className="card text-center py-12">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-gray-600 font-medium">Acesse os produtos para ver fichas técnicas e modos de preparo.</p>
          <a href="/produtos" className="btn-primary inline-block mt-4">Ver produtos</a>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: any; warn?: boolean }) {
  return (
    <div className={`card ${warn ? "border-red-200 bg-red-50" : ""}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${warn ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
