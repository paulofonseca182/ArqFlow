export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeContactPhone(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const digits = onlyDigits(trimmed);

  if (!digits) {
    return undefined;
  }

  if (trimmed.startsWith("+")) {
    return `+${digits.slice(0, 15)}`;
  }

  return digits;
}

export function isValidContactPhone(value?: string | null) {
  const normalized = normalizeContactPhone(value);

  if (!normalized) {
    return false;
  }

  if (normalized.startsWith("+")) {
    return /^\+[1-9]\d{7,14}$/.test(normalized);
  }

  const digits = onlyDigits(normalized);

  return digits.length === 10 || digits.length === 11;
}

export function maskContactPhoneInput(value: string) {
  const trimmedStart = value.trimStart();

  if (trimmedStart.startsWith("+")) {
    return `+${onlyDigits(trimmedStart).slice(0, 15)}`;
  }

  return maskBrazilianPhoneInput(value);
}

export function maskCellphoneInput(value: string) {
  return maskContactPhoneInput(value);
}

export function maskBrazilianPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatContactPhone(value?: string | null, fallback = "Não informado") {
  const normalized = normalizeContactPhone(value);

  if (!normalized) {
    return fallback;
  }

  if (normalized.startsWith("+")) {
    return formatInternationalPhone(normalized);
  }

  const digits = onlyDigits(normalized);

  if (digits.length === 11) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value ?? fallback;
}

export function formatCellphone(value?: string | null, fallback = "Não informado") {
  return formatContactPhone(value, fallback);
}

function formatInternationalPhone(value: string) {
  const digits = onlyDigits(value);

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const localDigits = digits.slice(2);
    const local =
      localDigits.length === 11
        ? `${localDigits.slice(0, 2)} ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`
        : `${localDigits.slice(0, 2)} ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;

    return `+55 ${local}`;
  }

  if (digits.startsWith("1") && digits.length === 11) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return `+${digits}`;
}
