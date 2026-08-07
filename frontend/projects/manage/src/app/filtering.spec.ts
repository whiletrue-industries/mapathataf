import { Workspace } from './api.service';
import { filterWorkspaces } from './filtering';

function workspace(id: string, city: string, favorite: boolean, active: boolean): Workspace {
  return {id, favorite, active, metadata: {city}};
}

describe('filterWorkspaces', () => {
  const workspaces = [
    workspace('dymonh', 'דימונה', true, true),
    workspace('khyph', 'חיפה', false, true),
    workspace('rht', 'רהט', false, false),
  ];

  it('returns everything sorted by city name for the default filters', () => {
    expect(filterWorkspaces(workspaces, 'all', 'all', '').map((w) => w.id))
      .toEqual(['dymonh', 'khyph', 'rht']);
  });

  it('filters by favorite', () => {
    expect(filterWorkspaces(workspaces, 'yes', 'all', '').map((w) => w.id)).toEqual(['dymonh']);
    expect(filterWorkspaces(workspaces, 'no', 'all', '').map((w) => w.id)).toEqual(['khyph', 'rht']);
  });

  it('filters by active', () => {
    expect(filterWorkspaces(workspaces, 'all', 'no', '').map((w) => w.id)).toEqual(['rht']);
  });

  it('searches by city name or slug', () => {
    expect(filterWorkspaces(workspaces, 'all', 'all', 'חיפ').map((w) => w.id)).toEqual(['khyph']);
    expect(filterWorkspaces(workspaces, 'all', 'all', 'rht').map((w) => w.id)).toEqual(['rht']);
    expect(filterWorkspaces(workspaces, 'all', 'all', 'אין')).toEqual([]);
  });

  it('combines filters', () => {
    expect(filterWorkspaces(workspaces, 'no', 'yes', '').map((w) => w.id)).toEqual(['khyph']);
  });
});
