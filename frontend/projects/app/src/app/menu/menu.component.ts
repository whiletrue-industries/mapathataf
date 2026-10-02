import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [
    RouterLink
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.less'
})
export class MenuComponent {

  active = false;

  add_new_form_link = 'https://form.jotform.com/252952688671472';

  commonLinks = [
    {
      title: 'בחירת מסגרת חינוכית',
      routerLink: ['/about', 'how-to-choose'],
    },
  ]

  constructor(public api: ApiService) {}
}
