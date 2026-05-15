import { api } from "./api";
import type { ApiSuccess } from "../types/api";
import type { ReportsOverview } from "../types/reports";

export async function getReportsOverview() {
  const response = await api.get<ApiSuccess<ReportsOverview>>("/reports/overview");

  return response.data.data;
}
