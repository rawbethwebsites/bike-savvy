export function formatRand(amount: number) {
  return `R${Math.max(0, Math.round(amount)).toLocaleString('en-US')}`;
}

export function humanizeDashboardStatus(status: string) {
  return status
    .replaceAll('_', ' ')
    .replace(/^./, (firstCharacter) => firstCharacter.toUpperCase());
}

export function formatDashboardDate(date: Date) {
  return date.toLocaleDateString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
