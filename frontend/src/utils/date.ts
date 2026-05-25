const datePartPattern = /^(\d{4})-(\d{2})-(\d{2})/;

export function toDateParamValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const match = datePartPattern.exec(value);

  if (match && isValidDateParts(match[1], match[2], match[3])) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateOnly(value?: string | null, fallback = "Não informada") {
  const dateParam = toDateParamValue(value);

  if (!dateParam) {
    return fallback;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC"
  }).format(new Date(`${dateParam}T00:00:00.000Z`));
}

function isValidDateParts(yearValue: string, monthValue: string, dayValue: string) {
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
