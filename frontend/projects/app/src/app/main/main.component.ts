import { AfterViewInit, Component, computed, signal } from '@angular/core';
import { MapComponent } from "../map/map.component";
import { PlatformService } from '../platform.service';
import { switchMap, timer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapboxService } from '../mapbox.service';
import { ItemListComponent } from "../item-list/item-list.component";

@Component({
  selector: 'app-main',
  imports: [MapComponent, ItemListComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.less'
})
export class MainComponent implements AfterViewInit {

  showMap = false;
  
  constructor(private platform: PlatformService, private route: ActivatedRoute, public api: ApiService, private mapboxService: MapboxService) {
    console.log('MainComponent constructor');
    this.route.params.pipe(
      takeUntilDestroyed(),
    ).subscribe((params) => {
      this.api.fetchData(params['workspaceId']).subscribe(() => {        
      });
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
