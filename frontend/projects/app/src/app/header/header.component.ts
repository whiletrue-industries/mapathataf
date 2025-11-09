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

  add_new_form_link = 'https://form.jotform.com/252952688671472';

  commonLinks = [
    {
      title: 'בחירת מסגרת חינוכית',
      routerLink: ['/about', 'how-to-choose'],
    },
  ]

  constructor(public api: ApiService, public state: StateService) {}
}
