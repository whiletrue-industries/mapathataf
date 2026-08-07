import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.router.navigate(['/']);
      }
    });
  }
}
