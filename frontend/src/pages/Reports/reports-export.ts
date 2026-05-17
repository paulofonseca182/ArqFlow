import type { ReportStatusCount, ReportsOverview } from "../../types/reports";

type CsvRow = Array<number | string>;

export function buildReportsCsv(overview: ReportsOverview) {
  const rows: CsvRow[] = [
    ["Grupo", "Indicador", "Valor", "Detalhe"],
    ["Período", "Nome", overview.period.label, `${formatDateParam(overview.period.from)} a ${formatDateParam(overview.period.to)}`],
    ["Período", "Gerado em", overview.generatedAt, ""],
    ["Filtro", "Cliente", overview.filters.clientName ?? "Todos", overview.filters.clientId ?? ""],
    ["Filtro", "Projeto", overview.filters.projectName ?? "Todos", overview.filters.projectId ?? ""],
    ["Clientes", "Clientes no período", overview.clients.total, ""],
    ["Clientes", "Clientes ativos", overview.clients.active, ""],
    ["Comercial", "Total de orçamentos", overview.commercial.totalBudgets, ""],
    ["Comercial", "Orçamentos abertos", overview.commercial.openBudgets, ""],
    ["Comercial", "Orçamentos aprovados", overview.commercial.approvedBudgets, ""],
    ["Comercial", "Orçamentos recusados", overview.commercial.refusedBudgets, ""],
    ["Comercial", "Conversão", `${overview.commercial.conversionRate}%`, "Aprovados sobre aprovados + recusados"],
    ["Comercial", "Valor aprovado", overview.commercial.approvedAmount, "BRL"],
    ["Comercial", "Valor em aberto", overview.commercial.openAmount, "BRL"],
    ["Financeiro", "Recebido", overview.financial.receivedAmount, "BRL"],
    ["Financeiro", "A receber", overview.financial.receivableAmount, "BRL"],
    ["Financeiro", "Atrasado", overview.financial.overdueAmount, "BRL"],
    ["Financeiro", "Parcelas pagas", overview.financial.paidPayments, ""],
    ["Financeiro", "Parcelas abertas", overview.financial.receivablePayments, ""],
    ["Financeiro", "Parcelas atrasadas", overview.financial.overduePayments, ""],
    ["Financeiro", "Ticket médio por projeto", overview.financial.averageProjectTicket, "BRL"],
    ["Projetos", "Total", overview.projects.total, ""],
    ["Projetos", "Ativos", overview.projects.active, ""],
    ["Projetos", "Finalizados", overview.projects.finished, ""],
    ["Projetos", "Cancelados", overview.projects.cancelled, ""],
    ["Projetos", "Valor contratado", overview.projects.totalContractedAmount, "BRL"],
    ["Projetos", "Progresso médio", `${overview.projects.averageProgress}%`, ""],
    ["Operação", "Tarefas totais", overview.operations.tasksTotal, ""],
    ["Operação", "Tarefas abertas", overview.operations.openTasks, ""],
    ["Operação", "Tarefas atrasadas", overview.operations.overdueTasks, ""],
    ["Operação", "Tarefas vencendo em 7 dias", overview.operations.dueSoonTasks, ""],
    ["Operação", "Tarefas urgentes", overview.operations.urgentTasks, ""],
    ["Operação", "Visitas agendadas", overview.operations.scheduledVisits, ""],
    ["Operação", "Visitas concluídas", overview.operations.completedVisits, ""],
    ["Operação", "Visitas em 7 dias", overview.operations.visitsNextSevenDays, ""],
    ["Operação", "Valor em visitas", overview.operations.visitsAmount, "BRL"]
  ];

  appendStatusRows(rows, "Clientes por status", overview.clients.byStatus);
  appendStatusRows(rows, "Orçamentos por status", overview.commercial.byStatus);
  appendStatusRows(rows, "Projetos por status", overview.projects.byStatus);
  appendStatusRows(rows, "Projetos por tipo", overview.projects.byType);
  appendStatusRows(rows, "Tarefas por status", overview.operations.byTaskStatus);
  appendStatusRows(rows, "Tarefas por prioridade", overview.operations.byTaskPriority);
  appendStatusRows(rows, "Visitas por status", overview.operations.byVisitStatus);
  appendStatusRows(rows, "Visitas por tipo", overview.operations.byVisitType);

  overview.projects.topReceivableProjects.forEach((project) => {
    rows.push(["Recebíveis por projeto", project.name, project.pendingAmount, `${project.clientName} | atrasado ${project.overdueAmount}`]);
  });

  return rows.map((row) => row.map(escapeCsvValue).join(";")).join("\r\n");
}

export function createReportExportFilename(overview: ReportsOverview) {
  const scopeParts = [
    overview.filters.clientName ? `cliente-${slugify(overview.filters.clientName)}` : "",
    overview.filters.projectName ? `projeto-${slugify(overview.filters.projectName)}` : ""
  ].filter(Boolean);
  const scopeSuffix = scopeParts.length > 0 ? `-${scopeParts.join("-")}` : "";

  return `arqflow-relatorios-${overview.period.key.toLowerCase()}-${formatDateParam(overview.period.from)}-${formatDateParam(overview.period.to)}${scopeSuffix}.csv`;
}

function appendStatusRows(rows: CsvRow[], group: string, items: ReportStatusCount[]) {
  items
    .filter((item) => item.count > 0)
    .forEach((item) => {
      rows.push([group, item.label, item.count, `${item.percentage}%`]);
    });
}

function escapeCsvValue(value: number | string) {
  const text = String(value);

  if (/[;\r\n"]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}

function formatDateParam(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
