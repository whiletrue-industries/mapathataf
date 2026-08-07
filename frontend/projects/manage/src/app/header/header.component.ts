import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './../auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent {
  auth = inject(AuthService);
  router = inject(Router);

  async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
