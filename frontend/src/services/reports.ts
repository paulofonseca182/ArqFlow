import { api } from "./api";
import type { ApiSuccess } from "../types/api";
import type { ReportsOverview, ReportsOverviewParams } from "../types/reports";

export async function getReportsOverview(params: ReportsOverviewParams) {
  const response = await api.get<ApiSuccess<ReportsOverview>>("/reports/overview", {
    params: {
      period: params.period,
      from: params.period === "CUSTOM" ? params.from : undefined,
      to: params.period === "CUSTOM" ? params.to : undefined
    }
  });

  return response.data.data;
}
