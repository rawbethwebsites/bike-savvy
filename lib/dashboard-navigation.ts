export type DashboardNavigationItem = {
  label: string;
  href: string;
  icon: 'dashboard' | 'calendar' | 'bookings' | 'customers';
};

export const dashboardNavigation: DashboardNavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Calendar', href: '/dashboard/calendar', icon: 'calendar' },
  { label: 'Bookings', href: '/dashboard/bookings', icon: 'bookings' },
  { label: 'Customers', href: '/dashboard/customers', icon: 'customers' },
];

export function isDashboardPathActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
