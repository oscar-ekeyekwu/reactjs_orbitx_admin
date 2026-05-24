import { Menu } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Page chrome — left-aligned hamburger (mobile only), title, optional
 * subtitle. Previously also rendered a global Search input and a
 * Notifications bell, both of which were decorative (no wiring); they
 * triggered "is this broken?" reactions from admins and were removed.
 * Wire-up replacements should reintroduce them as real surfaces, not
 * placeholders.
 */
export function Header({ title, subtitle }: HeaderProps) {
  const openSidebar = useUIStore((s) => s.openSidebar);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white px-4 md:h-16 md:px-6">
      <button
        type="button"
        aria-label="Open menu"
        onClick={openSidebar}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-gray-900 md:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden truncate text-sm text-gray-500 sm:block">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
