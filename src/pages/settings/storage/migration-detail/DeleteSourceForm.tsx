import {
  Button,
  DialogFooter,
  Input,
  Label,
} from '@/components/ui';
import {
  expectedDeleteSourcePhrase,
  type StorageMigration,
} from '@/services/api';
import { extractMessage } from './utils';

type Props = {
  migration: StorageMigration;
  providerSlug: string;
  typed: string;
  setTyped: (v: string) => void;
  onCancel: () => void;
  onSubmit: (confirm: string) => void;
  pending: boolean;
  error: unknown;
};

export function DeleteSourceForm({
  migration,
  providerSlug,
  typed,
  setTyped,
  onCancel,
  onSubmit,
  pending,
  error,
}: Props) {
  const expected = expectedDeleteSourcePhrase(
    migration.migratedCount,
    providerSlug,
  );
  const isMatch = typed === expected;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isMatch) return;
        onSubmit(typed);
      }}
      className="space-y-3"
    >
      <div className="rounded-md bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">
          Type this phrase exactly to enable Delete:
        </p>
        <p
          className="mt-1 font-mono text-sm"
          data-testid="storage-delete-expected"
        >
          {expected}
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="delete-source-confirm">Your confirmation</Label>
        <Input
          id="delete-source-confirm"
          data-testid="storage-delete-source-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      {error ? (
        <p
          data-testid="storage-delete-source-error"
          className="text-xs text-red-600"
        >
          {extractMessage(error)}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          data-testid="storage-delete-source-submit"
          disabled={!isMatch || pending}
        >
          {pending ? 'Deleting…' : 'Delete source copies'}
        </Button>
      </DialogFooter>
    </form>
  );
}
