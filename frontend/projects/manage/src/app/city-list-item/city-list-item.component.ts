import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Workspace } from '../api.service';

@Component({
  selector: 'app-city-list-item',
  imports: [RouterLink],
  templateUrl: './city-list-item.component.html',
  styleUrl: './city-list-item.component.less'
})
export class CityListItemComponent {
  workspace = input.required<Workspace>();
  logoBroken = signal(false);
}
