export const clientStatusValues = [
  "NEW_CONTACT",
  "IN_SERVICE",
  "BUDGET_SENT",
  "ACTIVE",
  "INACTIVE",
  "RECURRING"
] as const;

export type ClientStatus = (typeof clientStatusValues)[number];

export type ClientStatusOption = {
  value: ClientStatus;
  label: string;
};

export type ClientRelationCounts = {
  projects: number;
  budgets: number;
  payments: number;
  visits: number;
};

export type Client = {
  id: string;
  name: string;
  status: ClientStatus;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  cpfCnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: ClientRelationCounts;
};

export type ClientProjectRelation = {
  id: string;
  name: string;
  status: string;
  type: string;
  expectedDeliveryDate: string | null;
  _count: {
    budgets: number;
    payments: number;
    tasks: number;
    visits: number;
  };
};

export type ClientBudgetRelation = {
  id: string;
  title: string;
  finalAmount: string;
  status: string;
  createdAt: string;
};

export type ClientPaymentRelation = {
  id: string;
  amount: string;
  dueDate: string;
  status: string;
  description: string;
  source: string;
  project: {
    id: string;
    name: string;
  };
};

export type ClientVisitRelation = {
  id: string;
  type: string;
  status: string;
  date: string;
  time: string | null;
  amount: string | null;
  project: {
    id: string;
    name: string;
  } | null;
};

export type ClientDetail = Client & {
  projects: ClientProjectRelation[];
  budgets: ClientBudgetRelation[];
  payments: ClientPaymentRelation[];
  visits: ClientVisitRelation[];
};

export type ClientWriteInput = {
  name: string;
  status: ClientStatus;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  source?: string;
  notes?: string;
};

export type ClientDeleteImpact = {
  exists: boolean;
  hasRelations: boolean;
  counts: ClientRelationCounts;
};
