export function civilToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new RangeError("La fecha y la hora de nacimiento no son válidas.");
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const localAsUtc = new Date(0);
  localAsUtc.setUTCFullYear(year, month - 1, day);
  localAsUtc.setUTCHours(hour, minute, 0, 0);
  const desired = localAsUtc.getTime();
  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59 ||
    localAsUtc.getUTCFullYear() !== year ||
    localAsUtc.getUTCMonth() !== month - 1 ||
    localAsUtc.getUTCDate() !== day
  ) {
    throw new RangeError("La fecha y la hora de nacimiento no son válidas.");
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const localPartsAt = (instant: number) =>
    Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
  const offsetAt = (instant: number) => {
    const parts = localPartsAt(instant);
    const localAsUtc = new Date(0);
    localAsUtc.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    localAsUtc.setUTCHours(parts.hour, parts.minute, 0, 0);
    return localAsUtc.getTime() - instant;
  };

  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    offsets.add(offsetAt(desired + hours * 60 * 60 * 1000));
  }

  const matches = [...offsets]
    .map((offset) => desired - offset)
    .filter((instant) => {
      const parts = localPartsAt(instant);
      return (
        parts.year === year &&
        parts.month === month &&
        parts.day === day &&
        parts.hour === hour &&
        parts.minute === minute
      );
    })
    .sort((a, b) => a - b);

  if (matches.length === 0) {
    throw new RangeError(
      "Esa hora local no existió por el cambio de horario de verano.",
    );
  }
  return new Date(matches[0]);
}
