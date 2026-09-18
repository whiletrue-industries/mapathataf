import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent {
  active = false;

  // The key rides along as a query param on every link, so only the path may decide.
  EXACT_PATH: IsActiveMatchOptions = { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' };

  constructor(public api: ApiService) { }
}
