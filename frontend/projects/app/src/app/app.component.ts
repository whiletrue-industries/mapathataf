import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { marked } from 'marked';
import { PlatformService } from './platform.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  constructor(private platform: PlatformService) {
    this.platform.browser(() => {
      const renderer = new marked.Renderer();
      const linkRenderer = renderer.link;
      renderer.link = (href: string, title: string, text: string) => {
        const localLink = href.startsWith(`${location.protocol}//${location.hostname}`);
        const html = linkRenderer.call(renderer, href, title, text);
        return localLink ? html : html.replace(/^<a /, `<a target="_blank" rel="noreferrer noopener nofollow" `);  
      };
      marked.use({renderer});
    });
  }
}
