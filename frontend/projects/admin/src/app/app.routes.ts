import { Routes } from '@angular/router';
import { ItemListComponent } from './item-list/item-list.component';
import { ItemEditComponent } from './item-edit/item-edit.component';

export const routes: Routes = [
    {
        path: ':workspaceId/:itemId',
        component: ItemEditComponent
    },
    {
        path: ':workspaceId',
        component: ItemListComponent
    }
];
