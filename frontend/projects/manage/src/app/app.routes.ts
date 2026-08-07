import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { CityListComponent } from './city-list/city-list.component';
import { CityEditComponent } from './city-edit/city-edit.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: CityListComponent, canActivate: [authGuard] },
  { path: ':workspaceId', component: CityEditComponent, canActivate: [authGuard] },
];
