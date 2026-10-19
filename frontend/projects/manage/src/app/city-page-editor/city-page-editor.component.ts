import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';

// The city's own page in the map app's menu (metadata.city_page). The page is listed only
// while it has content; the title defaults to "הגיל הרך ב<city>" in the app.
export type CityPage = {
  title?: string;
  subtitle?: string;
  content?: string;
};

@Component({
  selector: 'app-city-page-editor',
  imports: [FormsModule, RichTextEditorComponent],
  templateUrl: './city-page-editor.component.html',
  styleUrl: './city-page-editor.component.less'
})
export class CityPageEditorComponent {
  page = input<CityPage | undefined>(undefined);
  city = input<string | undefined>(undefined);
  update = output<CityPage | null>();

  title = signal('');
  subtitle = signal('');
  content = signal('');
  dirty = signal(false);

  constructor() {
    effect(() => {
      const page = this.page();
      this.title.set(page?.title || '');
      this.subtitle.set(page?.subtitle || '');
      this.content.set(page?.content || '');
      this.dirty.set(false);
    });
  }

  save() {
    const page: CityPage = {};
    for (const key of ['title', 'subtitle', 'content'] as const) {
      const value = this[key]().trim();
      if (value) {
        page[key] = value;
      }
    }
    this.dirty.set(false);
    this.update.emit(Object.keys(page).length ? page : null);
  }
}
