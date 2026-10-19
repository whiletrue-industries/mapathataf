import { Component, computed, inject, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';
import { StateService } from '../../state.service';
import { PageHeaderComponent } from '../../page-header/page-header.component';
import { cityMenuItems, FROM_MENU, GENERAL_MENU_ITEMS } from '../menu-items';

@Component({
  selector: 'app-menu-page',
  imports: [RouterLink, NgTemplateOutlet, PageHeaderComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.less'
})
export class MenuPageComponent {
  api = inject(ApiService);
  state = inject(StateService);

  close = output<void>();

  fromMenu = {[FROM_MENU]: true};
  generalItems = GENERAL_MENU_ITEMS;
  cityItems = computed(() => cityMenuItems(this.api.workspace(), this.state.workspaceId()));
}
