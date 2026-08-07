import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  api = inject(ApiService);
  auth = inject(AuthService);

  async denySignOut() {
    await this.auth.signOut();
    this.api.authorized.set('unknown');
    window.location.href = '/login';
  }
}
