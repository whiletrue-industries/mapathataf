import { HttpClient } from '@angular/common/http';
import { Component, effect, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';


@Component({
  selector: 'app-markdown',
  imports: [],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.less'
})
export class MarkdownComponent {
  src = input<string>('');
  content = signal<string>('');

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    effect(() => {
      const src = this.src();
      console.log('Loading markdown content for src', src);
      if (src) {
        this.http.get(`/content/${src}.md`, { responseType: 'text' }).subscribe(data => {
          const sanitized = this.sanitizer.bypassSecurityTrustHtml(marked.parse(data));
          this.content.set(sanitized as string);
        });
      }
    });
  }
}
