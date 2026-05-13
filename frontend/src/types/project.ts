export const projectTypeValues = ["RESIDENTIAL", "INTERIORS", "RENOVATION", "COMMERCIAL", "OTHER"] as const;
export const projectStatusValues = [
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

export type ProjectType = (typeof projectTypeValues)[number];
export type ProjectStatus = (typeof projectStatusValues)[number];

export type ProjectOption<T extends string> = {
  value: T;
  label: string;
};

export type ProjectRelationCounts = {
  steps: number;
  budgets: number;
  payments: number;
  tasks: number;
  visits: number;
  documents: number;
  briefings: number;
};

export type ProjectClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  type: ProjectType;
  workAddress: string | null;
  area: string | null;
  contractedAmount: string | null;
  startsAt: string | null;
  expectedDeliveryDate: string | null;
  status: ProjectStatus;
  description: string | null;
  notes: string | null;
  internalNotes: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  progress: number;
  client: ProjectClientSummary;
  _count: ProjectRelationCounts;
};

export type ProjectWriteInput = {
  clientId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  workAddress?: string;
  area?: number;
  contractedAmount?: number;
  startsAt?: string;
  expectedDeliveryDate?: string;
  description?: string;
  notes?: string;
  internalNotes?: string;
  pinned?: boolean;
};

export type ProjectDeleteImpact = {
  exists: boolean;
  hasRelations: boolean;
  counts: ProjectRelationCounts;
};
