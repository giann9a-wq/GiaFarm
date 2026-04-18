import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  dashboardStats,
  moduleSummaries,
  recentDocuments,
  recentOperations,
  upcomingEvents
} from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Home"
        subtitle="Quadro operativo iniziale per campagna, lavorazioni, documenti, scadenze e comunicazioni interne."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Eventi futuri</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div className="flex gap-4" key={event.title}>
                <div className="w-16 rounded-[8px] bg-muted px-3 py-2 text-center text-sm font-semibold">
                  {event.date}
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.type}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Documenti recenti</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDocuments.map((document) => (
              <div className="rounded-[8px] border border-border p-4" key={document.name}>
                <p className="font-medium">{document.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {document.module} · {document.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ultime lavorazioni</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOperations.map((operation) => (
              <div key={operation.title}>
                <p className="text-sm text-muted-foreground">{operation.date}</p>
                <p className="mt-1 font-medium">{operation.title}</p>
                <p className="text-sm text-muted-foreground">{operation.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {moduleSummaries.map((module) => (
            <Link
              className="focus-ring rounded-[8px] border border-border bg-card p-5 shadow-sm transition hover:border-primary"
              href={module.href}
              key={module.href}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {module.description}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase text-primary">
                    {module.status}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
