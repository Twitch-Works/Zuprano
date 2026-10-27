"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  FolderTree,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin/auth";
import { useDealers, useOrders, useProducts } from "@/lib/admin/data";

export const NAV = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/products", icon: Package, label: "Products" },
  { path: "/admin/categories", icon: FolderTree, label: "Categories" },
  { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { path: "/admin/inventory", icon: Boxes, label: "Inventory" },
  { path: "/admin/dealers", icon: UserCheck, label: "Dealers" },
  { path: "/admin/dealers/verify", icon: UserCheck, label: "Verification", badge: true },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/pricing", icon: Tag, label: "Pricing" },
  { path: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
  { path: "/admin/reports", icon: ChartColumn, label: "Reports" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

function Sidebar({ collapsed, mobileOpen, onCloseMobile }: { collapsed: boolean; mobileOpen: boolean; onCloseMobile: () => void }) {
  const pathname = usePathname();
  const { dealers } = useDealers();
  const pending = dealers.filter((d) => d.verificationStatus === "pending").length;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} lg:sticky lg:top-0`}
    >
      <div className={`px-4 py-4 h-16 border-b border-gray-200 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {collapsed ? (
          <span className="text-2xl font-black text-orange-600">Z</span>
        ) : (
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tighter text-orange-600">ZUPRANO</span>
            <span className="ml-1 text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Admin</span>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ path, icon: Icon, label, badge }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={() => window.innerWidth < 1024 && onCloseMobile()}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 group relative ${
                active ? "bg-orange-50 text-orange-600 font-bold shadow-sm shadow-orange-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <div className="shrink-0">
                <Icon size={20} className={active ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"} />
              </div>
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {badge && pending > 0 && (
                <span
                  className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white`}
                >
                  {pending}
                </span>
              )}
              {collapsed && (
                <div className="fixed left-20 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
      <div className={`px-4 py-4 border-t border-gray-100 text-xs text-gray-400 font-medium ${collapsed ? "text-center" : ""}`}>
        {collapsed ? "©" : `© ${new Date().getFullYear()} Zuprano Admin`}
      </div>
    </aside>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { orders } = useOrders(200);
  const { dealers } = useDealers();
  const { products } = useProducts();

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const items = [
    ...orders.filter((o) => o.status === "pending").slice(0, 5).map((o) => ({ key: o.id, text: `New order #${o.orderNumber} from ${o.customerName}`, href: "/admin/orders" })),
    ...dealers.filter((d) => d.verificationStatus === "pending").map((d) => ({ key: d.id, text: `${d.name} is awaiting verification`, href: "/admin/dealers/verify" })),
    ...products.filter((p) => p.stock <= 20).slice(0, 5).map((p) => ({ key: p.id, text: `${p.name} is low on stock (${p.stock} left)`, href: "/admin/inventory" })),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-150"
      >
        <Bell size={18} />
        {items.length > 0 && (
          <span className="absolute top-2 right-2 bg-orange-600 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none font-bold border-2 border-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">Notifications</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {items.map((i) => (
                <li key={i.key}>
                  <Link href={i.href} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    {i.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ onToggleSidebar, onOpenMobile }: { onToggleSidebar: () => void; onOpenMobile: () => void }) {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const page = [...NAV].reverse().find((n) => pathname.startsWith(n.path))?.label ?? "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button onClick={onOpenMobile} aria-label="Open menu" className="lg:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors">
          <Menu size={20} />
        </button>
        <button onClick={onToggleSidebar} title="Toggle Sidebar" className="hidden lg:flex p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors">
          <Menu size={20} />
        </button>
        <span className="hidden sm:inline-block text-xs text-gray-400 uppercase tracking-widest font-bold">
          Workspace / <span className="text-gray-900">{page}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-3 mr-2">
          <Notifications />
          <Link href="/admin/settings" aria-label="Settings" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-150">
            <Settings size={18} />
          </Link>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-gray-900 leading-tight">{admin?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-tighter font-medium">{admin?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold border border-orange-200 shadow-sm">
            {admin?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/admin/login");
            }}
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, init } = useAdminAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => init(), [init]);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/admin/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-orange-200 rounded-full" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white relative overflow-hidden font-sans">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />}
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300">
        <Header onToggleSidebar={() => setCollapsed(!collapsed)} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto bg-[#f8f9fa]">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
