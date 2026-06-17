"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Bell } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/produtos": "Produtos",
  "/insumos": "Insumos",
  "/receitas": "Fichas Técnicas",
  "/markup": "Markup & Preços",
  "/relatorios": "Relatórios",
  "/whatsapp": "WhatsApp",
  "/configuracoes": "Configurações",
};

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = Object.entries(titles).find(([k]) => k === pathname || (k !== "/" && pathname.startsWith(k)))?.[1] ?? "Produção na Mão";

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
