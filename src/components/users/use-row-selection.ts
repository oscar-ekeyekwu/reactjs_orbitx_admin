import * as React from 'react';

/**
 * Page-scoped multi-select for list tables. Selection survives paging
 * and filter changes (ids are global), and `prune` drops ids that no
 * longer exist after a delete.
 */
export function useRowSelection() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const toggle = React.useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = React.useCallback((ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const prune = React.useCallback((ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  return {
    selected,
    selectedIds: Array.from(selected),
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAll,
    prune,
  };
}
