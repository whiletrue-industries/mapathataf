import { computed, Injectable, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export const BASE_URL = 'https://api-m5crpfzdeq-ez.a.run.app';

export type WorkspaceLink = {
  kind: 'internal' | 'external' | 'whatsapp';
  href: string;
  title: string;
};

export type WorkspaceMetadata = {
  city?: string;
  logo_url?: string;
  bounds?: number[];
  neighborhoods?: string[];
  links?: WorkspaceLink[];
  onboarding?: any;
  city_links?: string[];
  [key: string]: any;
};

export type Workspace = {
  id: string;
  key?: string;
  favorite: boolean;
  active: boolean;
  metadata: WorkspaceMetadata;
};

// The merge-update body: each metadata key's value replaces that key wholesale,
// null deletes it; flags are plain booleans
export type WorkspacePatch = {
  metadata?: {[key: string]: any};
  favorite?: boolean;
  active?: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  workspaces = signal<Workspace[]>([]);
  authorized = signal<'unknown' | 'yes' | 'no'>('unknown');
  loading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  fetchWorkspaces() {
    this.loading.set(true);
    this.http.get<Workspace[]>(`${BASE_URL}/manage/workspaces`).subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.authorized.set('yes');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.authorized.set('no');
        }
      },
    });
  }

  workspace(id: string): Signal<Workspace | undefined> {
    return computed(() => this.workspaces().find((w) => w.id === id));
  }

  updateWorkspace(id: string, patch: WorkspacePatch): Observable<Workspace> {
    return this.http.put<Workspace>(`${BASE_URL}/manage/workspaces/${id}`, patch).pipe(
      tap((workspace) => this.replaceWorkspace(workspace)),
    );
  }

  uploadLogo(id: string, file: File): Observable<{logo_url: string}> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<{logo_url: string}>(`${BASE_URL}/manage/workspaces/${id}/logo`, form).pipe(
      tap(({logo_url}) => {
        const workspace = this.workspaces().find((w) => w.id === id);
        if (workspace) {
          this.replaceWorkspace({...workspace, metadata: {...workspace.metadata, logo_url}});
        }
      }),
    );
  }

  private replaceWorkspace(workspace: Workspace) {
    this.workspaces.update((workspaces) =>
      workspaces.map((w) => w.id === workspace.id ? workspace : w));
  }
}
