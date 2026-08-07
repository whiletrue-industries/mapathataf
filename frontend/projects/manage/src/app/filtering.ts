import { Workspace } from './api.service';
import { FlagFilter } from './state.service';

function flagMatch(filter: FlagFilter, value: boolean): boolean {
  return filter === 'all' || (filter === 'yes') === value;
}

export function filterWorkspaces(workspaces: Workspace[], favorite: FlagFilter, active: FlagFilter, query: string): Workspace[] {
  const q = query.trim();
  return workspaces
    .filter((w) => flagMatch(favorite, w.favorite))
    .filter((w) => flagMatch(active, w.active))
    .filter((w) => !q || (w.metadata.city || '').includes(q) || w.id.includes(q))
    .sort((a, b) => (a.metadata.city || a.id).localeCompare(b.metadata.city || b.id));
}
