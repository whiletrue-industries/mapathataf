import { Component } from '@angular/core';
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
  active = false;

  commonLinks = [
    {
      title: 'הגיל הרך, מאיפה מתחילים?',
      routerLink: ['/about', 'early-childhood'],
      // href: 'https://data-city.my.canva.site/tafmap-guidelines'
    },
    {
      title: 'הדרכה ופיקוח מסגרות חינוך',
      routerLink: ['/about', 'supervision'],    
    },
    {
      title: 'צור קשר',
      routerLink: ['/about', 'contact'],
    },
  ]

  constructor(public api: ApiService, public state: StateService) {}
}
