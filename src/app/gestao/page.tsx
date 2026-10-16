import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Gestão" };

export default function GestaoPage() {
  return <AdminApp />;
}
