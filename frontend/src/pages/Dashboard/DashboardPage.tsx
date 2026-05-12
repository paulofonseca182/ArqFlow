import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";

const metrics = [
  { label: "Clientes", value: "0", tone: "neutral" as const },
  { label: "Projetos ativos", value: "0", tone: "success" as const },
  { label: "Pagamentos atrasados", value: "0", tone: "danger" as const },
  { label: "Vencem em 7 dias", value: "0", tone: "warning" as const }
];

export function DashboardPage() {
  return (
    <PageWrapper description="Resumo operacional do escritório." title="Dashboard">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard badge={<Badge tone={metric.tone}>Inicial</Badge>} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-text-primary">Próximas entregas</h3>
          <p className="mt-2 text-sm text-text-secondary">Acompanhe prazos relevantes dos projetos em andamento.</p>
          <div className="mt-5">
            <ProgressBar label="Projetos em andamento" value={0} />
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-text-primary">Alertas</h3>
          <p className="mt-2 text-sm text-text-secondary">Nenhum alerta crítico no momento.</p>
        </Card>
      </section>
    </PageWrapper>
  );
}
