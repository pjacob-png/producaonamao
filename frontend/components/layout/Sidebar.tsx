"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { clsx } from "clsx";
import {
  LayoutDashboard, Package, Layers, BookOpen,
  TrendingUp, BarChart2, MessageCircle, Settings, LogOut, Smartphone,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/insumos", label: "Insumos", icon: Layers },
  { href: "/receitas", label: "Fichas Técnicas", icon: BookOpen },
  { href: "/markup", label: "Markup & Preços", icon: TrendingUp, adminOnly: true },
  { href: "/relatorios", label: "Relatórios", icon: BarChart2, adminOnly: true },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone, adminOnly: true },
  { href: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-full shrink-0">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <div>
            <p className="font-bold text-sm leading-tight">Produção na Mão</p>
            <p className="text-gray-400 text-xs truncate max-w-[140px]">{user?.tenant_name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, adminOnly }) => {
          if (adminOnly && !isAdmin) return null;
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-brand-500 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-gray-400 truncate">{user?.name}</p>
          <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
