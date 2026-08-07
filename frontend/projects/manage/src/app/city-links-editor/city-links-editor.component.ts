import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Workspace } from '../api.service';

@Component({
  selector: 'app-city-links-editor',
  imports: [FormsModule],
  templateUrl: './city-links-editor.component.html',
  styleUrl: './city-links-editor.component.less'
})
export class CityLinksEditorComponent {
  cityLinks = input<string[] | undefined>(undefined);
  workspaces = input.required<Workspace[]>();
  selfId = input.required<string>();

  update = output<string[]>();

  selected = signal<string[]>([]);
  dirty = signal(false);
  query = signal('');

  cityName = computed(() => {
    const names = new Map<string, string>();
    for (const workspace of this.workspaces()) {
      names.set(workspace.id, workspace.metadata.city || workspace.id);
    }
    return (id: string) => names.get(id) || id;
  });

  // Autocomplete candidates: other workspaces, not yet linked, matching the query
  suggestions = computed(() => {
    const query = this.query().trim();
    if (!query) {
      return [];
    }
    const selected = this.selected();
    return this.workspaces()
      .filter((w) => w.id !== this.selfId() && !selected.includes(w.id))
      .filter((w) => (w.metadata.city || '').includes(query) || w.id.includes(query))
      .sort((a, b) => (a.metadata.city || a.id).localeCompare(b.metadata.city || b.id))
      .slice(0, 8);
  });

  constructor() {
    effect(() => {
      this.selected.set([...(this.cityLinks() || [])]);
      this.dirty.set(false);
      this.query.set('');
    });
  }

  add(id: string) {
    if (!this.selected().includes(id)) {
      this.selected.update((selected) => [...selected, id]);
      this.dirty.set(true);
    }
    this.query.set('');
  }

  remove(id: string) {
    this.selected.update((selected) => selected.filter((s) => s !== id));
    this.dirty.set(true);
  }

  save() {
    this.dirty.set(false);
    this.update.emit(this.selected());
  }
}
