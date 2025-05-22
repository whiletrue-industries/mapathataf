import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
    {
        path: ':workspaceId',
        component: MainComponent
    }
];
