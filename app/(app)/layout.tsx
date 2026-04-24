import { MobileNav } from "@/components/app/mobile-nav";
import { RouteProgress } from "@/components/app/route-progress";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { requireUser } from "@/lib/auth/permissions";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="flex min-h-screen bg-background">
      <RouteProgress />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userEmail={session.user?.email} userName={session.user?.name} />
        <MobileNav />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
