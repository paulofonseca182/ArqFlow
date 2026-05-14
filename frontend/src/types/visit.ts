export const visitStatusValues = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export const visitTypeValues = ["TECHNICAL_VISIT", "MEASUREMENT", "SITE_INSPECTION", "CLIENT_MEETING", "OTHER"] as const;

export type VisitStatus = (typeof visitStatusValues)[number];
export type VisitType = (typeof visitTypeValues)[number];

export type VisitOption<T extends string> = {
  value: T;
  label: string;
};

export type VisitClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export type VisitProjectSummary = {
  id: string;
  name: string;
  status: string;
  clientId: string;
};

export type Visit = {
  id: string;
  clientId: string;
  projectId: string | null;
  type: VisitType;
  date: string;
  time: string | null;
  address: string | null;
  amount: string | null;
  status: VisitStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: VisitClientSummary;
  project: VisitProjectSummary | null;
};

export type VisitWriteInput = {
  clientId: string;
  projectId?: string | null;
  type: VisitType;
  date: string;
  time?: string;
  address?: string;
  amount?: number;
  status: VisitStatus;
  notes?: string;
};
