import { HttpClient } from '@angular/common/http';
import { Component, effect, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { renderMarkdown } from './render';

// Renders a page of markdown: a file under /content (`src`, trusted - it ships with the
// app) or a string (`markdown`, e.g. a city page edited in the manage console, which goes
// through Angular's HTML sanitizer).
@Component({
  selector: 'app-markdown',
  imports: [],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.less'
})
export class MarkdownComponent {
  src = input<string>('');
  markdown = input<string>('');
  accordion = input<boolean>(false);
  categoryIcons = input<boolean>(false);

  content = signal<SafeHtml | string>('');

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    effect(() => {
      const options = {accordion: this.accordion(), categoryIcons: this.categoryIcons()};
      const markdown = this.markdown();
      const src = this.src();
      if (markdown) {
        this.content.set(renderMarkdown(markdown, options));
      } else if (src) {
        this.http.get(`/content/${src}.md`, { responseType: 'text' }).subscribe(data => {
          this.content.set(this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(data, options)));
        });
      }
    });
  }
}
