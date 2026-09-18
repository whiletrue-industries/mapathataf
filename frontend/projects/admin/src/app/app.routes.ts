import { Routes } from '@angular/router';
import { ItemListComponent } from './item-list/item-list.component';
import { ItemEditComponent } from './item-edit/item-edit.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    // Must stay ahead of :itemId, which would otherwise swallow 'items' as an item id.
    {
        path: ':workspaceId/items',
        component: ItemListComponent
    },
    {
        path: ':workspaceId/:itemId',
        component: ItemEditComponent
    },
    {
        path: ':workspaceId',
        component: DashboardComponent
    }
];
