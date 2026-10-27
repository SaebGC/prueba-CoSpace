import { AdminSidebar } from "@/components/shared/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}