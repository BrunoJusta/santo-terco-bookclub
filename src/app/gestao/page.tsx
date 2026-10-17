import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";
import { ScrollShell } from "@/components/ScrollShell";

export const metadata: Metadata = { title: "Gestão" };

export default function GestaoPage() {
  return (
    <ScrollShell>
      <AdminApp />
    </ScrollShell>
  );
}
