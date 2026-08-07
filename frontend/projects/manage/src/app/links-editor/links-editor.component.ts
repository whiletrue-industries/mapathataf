import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceLink } from '../api.service';

@Component({
  selector: 'app-links-editor',
  imports: [FormsModule],
  templateUrl: './links-editor.component.html',
  styleUrl: './links-editor.component.less'
})
export class LinksEditorComponent {
  links = input<WorkspaceLink[] | undefined>(undefined);
  update = output<WorkspaceLink[]>();

  rows = signal<WorkspaceLink[]>([]);
  dirty = signal(false);

  constructor() {
    effect(() => {
      this.rows.set((this.links() || []).map((link) => ({...link})));
      this.dirty.set(false);
    });
  }

  addRow() {
    this.rows.update((rows) => [...rows, {kind: 'external', href: '', title: ''}]);
    this.dirty.set(true);
  }

  removeRow(index: number) {
    this.rows.update((rows) => rows.filter((_, i) => i !== index));
    this.dirty.set(true);
  }

  save() {
    const links = this.rows().filter((link) => link.href.trim() || link.title.trim());
    this.dirty.set(false);
    this.update.emit(links);
  }
}
