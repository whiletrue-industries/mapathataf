import { AfterViewInit, Component, computed, effect, signal } from '@angular/core';
import { MapComponent } from "../map/map.component";
import { PlatformService } from '../platform.service';
import { switchMap, timer } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapboxService } from '../mapbox.service';
import { ItemListComponent } from "../item-list/item-list.component";
import { HeaderComponent } from "../header/header.component";
import { StateService } from '../state.service';

@Component({
  selector: 'app-main',
  imports: [MapComponent, ItemListComponent, HeaderComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.less'
})
export class MainComponent implements AfterViewInit {

  showMap = false;
  
  constructor(
    private platform: PlatformService,
    private route: ActivatedRoute,
    public api: ApiService,
    private mapboxService: MapboxService,
    private state: StateService
  ) {
    console.log('MainComponent constructor');
    this.route.params.pipe(
      takeUntilDestroyed(),
    ).subscribe((params) => {
      this.api.fetchData(params['workspaceId']).subscribe(() => {        
      });
    });
    this.route.fragment.pipe(
      takeUntilDestroyed(),
    ).subscribe((fragment) => {
      this.state.updateStateFromFragment(fragment);
    });
  }
  ngAfterViewInit() {
    this.platform.browser(() => {
      timer(0).pipe(
        switchMap(() => {
          return this.mapboxService.init;
        })
      ).subscribe(() => {
        console.log('MainComponent browser');
        this.showMap = true;
      });
    });
  }
}
