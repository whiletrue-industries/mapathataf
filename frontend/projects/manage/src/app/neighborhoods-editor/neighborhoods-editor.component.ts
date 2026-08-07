import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-neighborhoods-editor',
  imports: [FormsModule],
  templateUrl: './neighborhoods-editor.component.html',
  styleUrl: './neighborhoods-editor.component.less'
})
export class NeighborhoodsEditorComponent {
  neighborhoods = input<string[] | undefined>(undefined);
  update = output<string[]>();

  text = signal('');
  dirty = signal(false);

  constructor() {
    effect(() => {
      this.text.set((this.neighborhoods() || []).join('\n'));
      this.dirty.set(false);
    });
  }

  save() {
    const neighborhoods = this.text().split('\n').map((line) => line.trim()).filter((line) => !!line);
    this.dirty.set(false);
    this.update.emit(neighborhoods);
  }
}
