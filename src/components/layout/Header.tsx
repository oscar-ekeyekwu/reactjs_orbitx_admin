import { Bell, Menu, Search } from 'lucide-react';
import { Input } from '@/components/ui';
import { useUIStore } from '@/stores/uiStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const openSidebar = useUIStore((s) => s.openSidebar);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-white px-4 md:px-6">
      {/* Mobile hamburger — only visible below md where the sidebar
          drawer is off-canvas. */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={openSidebar}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-gray-900 md:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden truncate text-sm text-gray-500 sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search — hidden on small screens. The mobile UX uses
            per-page filter inputs instead of this global chrome. */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
