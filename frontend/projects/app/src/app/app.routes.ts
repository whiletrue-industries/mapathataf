import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
    {
        path: 'about/:section',
        component: AboutComponent
    },
    {
        path: ':workspaceId',
        component: MainComponent
    }
];
