import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/Shell";

export const metadata: Metadata = {
  title: "Zuprano Admin Dashboard | Dealer & Inventory Platform",
  description: "Powerful admin dashboard for managing dealers, products, inventory, and orders. Real-time analytics and business insights.",
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
