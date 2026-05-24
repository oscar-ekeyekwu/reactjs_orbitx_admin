import { Palette, Check, Sun, Moon, Monitor } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  useThemeStore,
  ACCENT_OPTIONS,
  type ThemeMode,
} from '@/stores/themeStore';
import { cn } from '@/lib/utils';

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function AppearanceSettingsPage() {
  const mode = useThemeStore((s) => s.mode);
  const accentId = useThemeStore((s) => s.accentId);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  return (
    <div>
      <Header
        title="Appearance"
        subtitle="Customize the look and feel of the admin panel"
      />

      <div className="p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Appearance' },
          ]}
        />

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
              <CardDescription>
                Choose between light, dark, or match your operating system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-md border p-4 transition-colors hover:bg-accent',
                      mode === value
                        ? 'border-primary bg-primary/5'
                        : 'border-input',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent color</CardTitle>
              <CardDescription>
                The accent color drives buttons, active nav items, and focus rings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {ACCENT_OPTIONS.map((accent) => {
                  const isActive = accent.id === accentId;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => setAccent(accent.id)}
                      aria-label={accent.name}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 transition-transform hover:scale-110',
                        isActive && 'ring-2 ring-offset-2',
                      )}
                      style={
                        {
                          backgroundColor: `hsl(${accent.hsl})`,
                          '--tw-ring-color': `hsl(${accent.hsl})`,
                        } as React.CSSProperties
                      }
                    >
                      {isActive && (
                        <Check className="h-5 w-5 text-white drop-shadow" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Changes apply immediately and are saved to your browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
