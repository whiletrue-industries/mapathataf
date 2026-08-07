import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { ApiService, WorkspaceLink, WorkspacePatch } from '../api.service';
import { adminLink, appLink } from '../links';
import { Field } from '../fields';
import { ItemEditSectionComponent } from '../item-edit-section/item-edit-section.component';
import { LogoUploadComponent } from '../logo-upload/logo-upload.component';
import { BoundsEditorComponent } from '../bounds-editor/bounds-editor.component';
import { NeighborhoodsEditorComponent } from '../neighborhoods-editor/neighborhoods-editor.component';
import { LinksEditorComponent } from '../links-editor/links-editor.component';
import { CityLinksEditorComponent } from '../city-links-editor/city-links-editor.component';

export const GENERAL_FIELDS: Field[] = [
  {name: 'city', type: 'text', label: 'שם הרשות'},
  {name: 'favorite', type: 'boolean', label: 'מועדפת'},
  {name: 'active', type: 'boolean', label: 'פעילה (מוצגת בדף הבית)'},
];

export const ONBOARDING_FIELDS: Field[] = [
  {name: 'enabled', type: 'boolean', label: 'מסכי הפתיחה פעילים'},
  {name: 'questions', type: 'multi-enum', label: 'שאלות', options: [
    {id: 'age', display: 'גיל הילד'},
    {id: 'interest', display: 'תחום עניין'},
    {id: 'address', display: 'כתובת מגורים'},
  ]},
  {name: 'welcome_title', type: 'text', label: 'כותרת פתיחה'},
  {name: 'welcome_intro', type: 'textarea', label: 'פסקת פתיחה'},
  {name: 'welcome_tagline', type: 'text', label: 'שורת סיום מודגשת'},
  {name: 'welcome_prompt', type: 'text', label: 'שאלת פתיחה'},
  {name: 'disclaimer_text', type: 'textarea', label: 'טקסט הבהרה'},
];

export function flattenOnboarding(onboarding: any): any {
  return {
    enabled: onboarding?.enabled ?? false,
    questions: onboarding?.questions,
    welcome_title: onboarding?.welcome?.title,
    welcome_intro: onboarding?.welcome?.intro,
    welcome_tagline: onboarding?.welcome?.tagline,
    welcome_prompt: onboarding?.welcome?.prompt,
    disclaimer_text: onboarding?.disclaimer?.text,
  };
}

export function buildOnboarding(flat: any): any {
  const onboarding: any = {enabled: !!flat.enabled};
  if (flat.questions !== undefined) {
    onboarding.questions = flat.questions;
  }
  const welcome: any = {};
  for (const key of ['title', 'intro', 'tagline', 'prompt']) {
    const value = flat['welcome_' + key];
    if (value) {
      welcome[key] = value;
    }
  }
  if (Object.keys(welcome).length) {
    onboarding.welcome = welcome;
  }
  if (flat.disclaimer_text) {
    onboarding.disclaimer = {text: flat.disclaimer_text};
  }
  return onboarding;
}

@Component({
  selector: 'app-city-edit',
  imports: [RouterLink, ItemEditSectionComponent, LogoUploadComponent,
    BoundsEditorComponent, NeighborhoodsEditorComponent, LinksEditorComponent, CityLinksEditorComponent],
  templateUrl: './city-edit.component.html',
  styleUrl: './city-edit.component.less'
})
export class CityEditComponent {
  api = inject(ApiService);

  GENERAL_FIELDS = GENERAL_FIELDS;
  ONBOARDING_FIELDS = ONBOARDING_FIELDS;

  workspaceId = signal<string>('');
  workspace = computed(() => this.api.workspaces().find((w) => w.id === this.workspaceId()));
  generalData = computed(() => {
    const workspace = this.workspace();
    return workspace ? {
      city: workspace.metadata.city,
      favorite: workspace.favorite,
      active: workspace.active,
    } : null;
  });
  onboardingData = computed(() => {
    const workspace = this.workspace();
    return workspace ? flattenOnboarding(workspace.metadata.onboarding) : null;
  });
  adminLink = computed(() => {
    const workspace = this.workspace();
    return workspace ? adminLink(workspace) : null;
  });
  appLink = computed(() => {
    const workspace = this.workspace();
    return workspace ? appLink(workspace) : null;
  });

  saving = signal(false);
  saveError = signal<string | null>(null);
  copied = signal<string | null>(null);

  private pending: WorkspacePatch = {};
  private queue$ = new Subject<void>();

  constructor(route: ActivatedRoute) {
    route.params.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.workspaceId.set(params['workspaceId']);
    });
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.api.workspaces().length) {
      this.api.fetchWorkspaces();
    }
    this.queue$.pipe(
      debounceTime(750),
      takeUntilDestroyed(),
    ).subscribe(() => this.flush());
  }

  queue(patch: WorkspacePatch) {
    if (patch.metadata) {
      this.pending.metadata = {...this.pending.metadata, ...patch.metadata};
    }
    for (const flag of ['favorite', 'active'] as const) {
      if (patch[flag] !== undefined) {
        this.pending[flag] = patch[flag];
      }
    }
    this.saveError.set(null);
    this.queue$.next();
  }

  private flush() {
    const patch = this.pending;
    this.pending = {};
    if (!Object.keys(patch).length) {
      return;
    }
    this.saving.set(true);
    this.api.updateWorkspace(this.workspaceId(), patch).subscribe({
      next: () => this.saving.set(false),
      error: () => {
        this.saving.set(false);
        this.saveError.set('השמירה נכשלה');
      },
    });
  }

  onGeneralUpdate(patch: any) {
    if ('city' in patch) {
      this.queue({metadata: {city: patch['city']}});
    }
    for (const flag of ['favorite', 'active'] as const) {
      if (flag in patch) {
        this.queue({[flag]: !!patch[flag]});
      }
    }
  }

  onOnboardingUpdate(patch: any) {
    const merged = {...this.onboardingData(), ...patch};
    this.queue({metadata: {onboarding: buildOnboarding(merged)}});
  }

  onBoundsUpdate(bounds: number[]) {
    this.queue({metadata: {bounds}});
  }

  onNeighborhoodsUpdate(neighborhoods: string[]) {
    this.queue({metadata: {neighborhoods: neighborhoods.length ? neighborhoods : null}});
  }

  onLinksUpdate(links: WorkspaceLink[]) {
    this.queue({metadata: {links: links.length ? links : null}});
  }

  // An empty list stays an empty list - the presence of city_links is what makes
  // a workspace an eshkol (cluster)
  onCityLinksUpdate(cityLinks: string[]) {
    this.queue({metadata: {city_links: cityLinks}});
  }

  copy(text: string | null) {
    if (text) {
      navigator.clipboard.writeText(text);
      this.copied.set(text);
      setTimeout(() => this.copied.set(null), 2000);
    }
  }
}
