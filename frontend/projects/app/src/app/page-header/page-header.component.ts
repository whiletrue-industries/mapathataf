import { Component, inject, output, signal } from '@angular/core';
import { ApiService } from '../api.service';

// The header of the full-page views (menu, content pages): a close button, the kite and
// the city's logo, right to left.
@Component({
  selector: 'app-page-header',
  imports: [],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.less'
})
export class PageHeaderComponent {
  api = inject(ApiService);

  close = output<void>();
  cityLogoBroken = signal<boolean>(false);
}
