import { api } from "./api";
import type { ApiSuccess } from "../types/api";
import type { DashboardSummary } from "../types/dashboard";

export async function getDashboardSummary() {
  const response = await api.get<ApiSuccess<DashboardSummary>>("/dashboard");

  return response.data.data;
}
