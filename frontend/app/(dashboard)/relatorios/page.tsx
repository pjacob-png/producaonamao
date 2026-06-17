"use client";
import { useEffect, useState } from "react";
import { reportsApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLORS: Record<string, string> = { A: "#22c55e", B: "#f97316", C: "#94a3b8" };

export default function RelatoriosPage() {
  const [cmv, setCmv] = useState<any>(null);
  const [abc, setAbc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.cmvOverview().then((r) => setCmv(r.data)).catch(() => {}),
      reportsApi.abcCurve().then((r) => setAbc(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  const summary = cmv?.summary;
  const items: any[] = cmv?.items || [];
  const abcItems: any[] = abc?.items || [];

  const abcPie = ["A", "B", "C"].map((g) => ({
    name: `Curva ${g}`,
    value: abcItems.filter((i) => i.abc_class === g).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Relatórios</h2>
        <p className="text-gray-500 text-sm">Visão geral de CMV e curva ABC do seu cardápio</p>
      </div>

      {/* Sumário */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Produtos com receita" value={summary.total_products_with_recipe} />
          <StatCard
            label="CMV médio"
            value={`${summary.avg_cmv_pct}%`}
            status={summary.avg_cmv_pct > 40 ? "warn" : summary.avg_cmv_pct > 30 ? "ok" : "good"}
          />
          <StatCard
            label="CMV acima de 40%"
            value={summary.high_cmv_count}
            status={summary.high_cmv_count > 0 ? "warn" : "good"}
          />
          <StatCard
            label="Preço abaixo do sugerido"
            value={summary.products_below_suggested}
            status={summary.products_below_suggested > 0 ? "warn" : "good"}
          />
        </div>
      )}

      {/* CMV por produto */}
      {items.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">CMV por produto (Top 20)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={items.slice(0, 20)} margin={{ top: 0, right: 0, left: -10, bottom: 60 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, "CMV"]} />
              <Bar dataKey="cmv_pct" radius={[4, 4, 0, 0]}>
                {items.slice(0, 20).map((entry, i) => (
                  <Cell key={i} fill={entry.cmv_pct > 40 ? "#ef4444" : entry.cmv_pct > 30 ? "#f97316" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1" />até 30%
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mx-1 ml-3" />30–40%
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mx-1 ml-3" />acima 40%
          </p>
        </div>
      )}

      {/* Curva ABC */}
      {abcItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-1 flex flex-col items-center">
            <h3 className="font-semibold mb-4 self-start">Distribuição ABC</h3>
            <PieChart width={200} height={200}>
              <Pie data={abcPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {abcPie.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name.slice(-1)]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="font-semibold mb-4">Curva ABC — detalhamento</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b">
                    <th className="pb-2 font-medium">Produto</th>
                    <th className="pb-2 font-medium text-right">Receita %</th>
                    <th className="pb-2 font-medium text-right">CMV %</th>
                    <th className="pb-2 font-medium text-center">Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {abcItems.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-700">{item.name}</td>
                      <td className="py-2 text-right text-gray-500">{item.revenue_pct?.toFixed(1)}%</td>
                      <td className="py-2 text-right text-gray-500">{item.cmv_pct?.toFixed(1)}%</td>
                      <td className="py-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: COLORS[item.abc_class] || "#94a3b8" }}
                        >
                          {item.abc_class}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!summary && !abcItems.length && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-lg mb-2">Nenhum dado ainda</p>
          <p className="text-sm">Cadastre produtos com fichas técnicas para gerar relatórios de CMV.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, status }: { label: string; value: any; status?: "good" | "ok" | "warn" }) {
  const Icon = status === "good" ? TrendingDown : status === "warn" ? TrendingUp : Minus;
  const color = status === "good" ? "text-green-500" : status === "warn" ? "text-red-500" : "text-gray-400";
  return (
    <div className="card flex items-start justify-between gap-2">
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-bold mt-1">{value ?? "—"}</p>
      </div>
      {status && <Icon size={18} className={color} />}
    </div>
  );
}
