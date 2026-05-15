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
