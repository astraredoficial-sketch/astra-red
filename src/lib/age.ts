export function isAtLeastAge(
  birthDate: string,
  minimumAge = 18,
  referenceDate = new Date(),
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return false;
  }

  const todayYear = referenceDate.getFullYear();
  const todayMonth = referenceDate.getMonth() + 1;
  const todayDay = referenceDate.getDate();
  const isLeapYear =
    todayYear % 4 === 0 && (todayYear % 100 !== 0 || todayYear % 400 === 0);
  const anniversaryDay =
    month === 2 && day === 29 && !isLeapYear ? 28 : day;
  let age = todayYear - year;
  if (
    todayMonth < month ||
    (todayMonth === month && todayDay < anniversaryDay)
  ) {
    age -= 1;
  }

  return age >= minimumAge;
}
