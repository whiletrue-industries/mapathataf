import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { RouterLink } from '@angular/router';
import { StateService } from '../state.service';

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

  constructor(public api: ApiService, public state: StateService) {}

  // The detail view has no chrome of its own, so this button doubles as its close control.
  press() {
    if (this.state.selectedId()) {
      this.state.selectedId.set(null);
    } else {
      this.active = true;
    }
  }
}
