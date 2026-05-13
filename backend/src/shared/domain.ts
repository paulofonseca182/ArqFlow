export const clientStatuses = ["NEW_CONTACT", "IN_SERVICE", "BUDGET_SENT", "ACTIVE", "INACTIVE", "RECURRING"] as const;
export const projectTypes = ["RESIDENTIAL", "INTERIORS", "RENOVATION", "COMMERCIAL", "OTHER"] as const;
export const projectStatuses = [
  "CONTRACT_IN_PROGRESS",
  "CONTRACT_SIGNED",
  "SURVEY_IN_PROGRESS",
  "ANTEPROJECT_IN_DEVELOPMENT",
  "WAITING_CLIENT_APPROVAL",
  "DESIGN_3D_IN_DEVELOPMENT",
  "EXECUTIVE_PROJECT_IN_DEVELOPMENT",
  "FINAL_DELIVERY",
  "FINISHED",
  "CANCELLED"
] as const;
export const stepStatuses = ["PENDING", "IN_PROGRESS", "WAITING_CLIENT", "IN_REVIEW", "COMPLETED", "CANCELLED"] as const;
export const budgetStatuses = ["DRAFT", "SENT", "NEGOTIATION", "APPROVED", "REFUSED", "EXPIRED", "CANCELLED"] as const;
export const paymentStatuses = ["RECEIVABLE", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"] as const;
export const paymentMethods = ["CASH", "PIX", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "BOLETO", "OTHER"] as const;
export const taskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const visitStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export const documentTypes = ["CONTRACT", "PROPOSAL", "BLUEPRINT", "PHOTO", "PERMIT", "OTHER"] as const;
export const briefingTypes = ["RESIDENTIAL", "INTERIORS", "RENOVATION", "COMMERCIAL", "OTHER"] as const;

export type ClientStatus = (typeof clientStatuses)[number];
export type ProjectType = (typeof projectTypes)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type StepStatus = (typeof stepStatuses)[number];
export type BudgetStatus = (typeof budgetStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type VisitStatus = (typeof visitStatuses)[number];
export type DocumentType = (typeof documentTypes)[number];
export type BriefingType = (typeof briefingTypes)[number];

export const clientStatusLabels: Record<ClientStatus, string> = {
  NEW_CONTACT: "Novo contato",
  IN_SERVICE: "Em atendimento",
  BUDGET_SENT: "Orçamento enviado",
  ACTIVE: "Cliente ativo",
  INACTIVE: "Cliente inativo",
  RECURRING: "Cliente recorrente"
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  CONTRACT_IN_PROGRESS: "Contrato em andamento",
  CONTRACT_SIGNED: "Contrato assinado",
  SURVEY_IN_PROGRESS: "Levantamento em andamento",
  ANTEPROJECT_IN_DEVELOPMENT: "Anteprojeto em desenvolvimento",
  WAITING_CLIENT_APPROVAL: "Aguardando aprovação do cliente",
  DESIGN_3D_IN_DEVELOPMENT: "Desenho 3D em desenvolvimento",
  EXECUTIVE_PROJECT_IN_DEVELOPMENT: "Projeto executivo em desenvolvimento",
  FINAL_DELIVERY: "Entrega final",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado"
};

export const projectTypeLabels: Record<ProjectType, string> = {
  RESIDENTIAL: "Residencial",
  INTERIORS: "Interiores",
  RENOVATION: "Reforma",
  COMMERCIAL: "Comercial",
  OTHER: "Outro"
};

export const stepStatusLabels: Record<StepStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  WAITING_CLIENT: "Aguardando cliente",
  IN_REVIEW: "Em revisão",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada"
};
