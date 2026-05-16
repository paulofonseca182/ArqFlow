export function getStringSearchParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.trim() ?? "";
}

export function getEnumSearchParam<T extends string>(searchParams: URLSearchParams, key: string, values: readonly T[]): T | "" {
  const value = searchParams.get(key);

  return values.includes(value as T) ? (value as T) : "";
}

export function getBooleanSearchParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.toLowerCase();

  return value === "true" || value === "1";
}

export function getDateSearchParam(searchParams: URLSearchParams, key: string) {
  const value = getStringSearchParam(searchParams, key);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "";
  }

  return value;
}
