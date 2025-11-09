import { Component, signal } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MarkdownComponent } from "./markdown/markdown.component";

@Component({
  selector: 'app-about',
  imports: [HeaderComponent, MarkdownComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.less'
})
export class AboutComponent {
  section = signal<string>('');
  href = signal<string>('');

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.section.set(params['section']);
    });
    this.route.queryParams.subscribe(queryParams => {
      this.href.set(queryParams['href'] || '');
    });
  }

  goBack() {
    window.history.back();
  }
}
