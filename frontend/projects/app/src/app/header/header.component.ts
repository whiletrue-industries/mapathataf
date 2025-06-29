import { Component, input } from '@angular/core';
import { ApiService } from '../api.service';
import { RouterLink } from '@angular/router';
import { StateService } from '../state.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent {

  kindSelection = input(true);

  active = false;

  commonLinks = [
    {
      title: 'הגיל הרך, מאיפה מתחילים?',
      routerLink: ['/about', 'early-childhood'],
      // href: 'https://data-city.my.canva.site/tafmap-guidelines'
    },
    {
      title: 'פיקוח והדרכה',
      routerLink: ['/about', 'supervision'],    
    },
  ]

  constructor(public api: ApiService, public state: StateService) {}
}
