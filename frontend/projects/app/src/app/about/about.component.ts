import { Component, signal } from '@angular/core';
import { MenuComponent } from "../menu/menu.component";
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MarkdownComponent } from "./markdown/markdown.component";
import { StateService } from '../state.service';

@Component({
  selector: 'app-about',
  imports: [MenuComponent, MarkdownComponent, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.less'
})
export class AboutComponent {
  section = signal<string>('');
  href = signal<string>('');

  constructor(private route: ActivatedRoute, public state: StateService) {
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
