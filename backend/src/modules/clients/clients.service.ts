import { clientStatusLabels, clientStatuses } from "../../shared/domain.js";

export function getClientsMeta() {
  return {
    statuses: clientStatuses.map((value) => ({
      value,
      label: clientStatusLabels[value]
    }))
  };
}
