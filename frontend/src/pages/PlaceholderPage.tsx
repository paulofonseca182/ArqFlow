import { Card } from "../components/ui/Card";
import { PageWrapper } from "../components/layout/PageWrapper";

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <PageWrapper description="Área preparada para receber o fluxo operacional." title={title}>
      <Card>
        <p className="text-sm text-text-secondary">Nenhum registro cadastrado ainda.</p>
      </Card>
    </PageWrapper>
  );
}
