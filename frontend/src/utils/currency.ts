const brlFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency"
});

export function formatCurrency(value: string | number | null | undefined) {
  const amount = toNumber(value);

  return brlFormatter.format(amount ?? 0);
}

export function maskCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return brlFormatter.format(Number(digits) / 100);
}

export function parseCurrencyInput(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return Number(value);
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits) / 100;
}

export function parseOptionalCurrencyInput(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = parseCurrencyInput(value);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function toCurrencyInputValue(value?: string | number | null) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  return formatCurrency(value);
}

function toNumber(value: string | number | null | undefined) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes("R$")) {
    const parsed = parseCurrencyInput(trimmed);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (trimmed.includes(",")) {
    const parsed = Number(trimmed.replace(/\./g, "").replace(",", "."));

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
}
