import { AfterViewInit, Component, computed, effect, Inject, signal } from '@angular/core';
import { MapComponent } from "../map/map.component";
import { PlatformService } from '../platform.service';
import { switchMap, take, timer } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapboxService } from '../mapbox.service';
import { ResultsDrawerComponent } from "../results-drawer/results-drawer.component";
import { MenuComponent } from "../menu/menu.component";
import { StateService } from '../state.service';
import { SearchBarComponent } from "../search-bar/search-bar.component";
import { FilterSheetComponent } from "../filter-sheet/filter-sheet.component";
import { ItemSheetComponent } from "../item-sheet/item-sheet.component";
import { DOCUMENT } from '@angular/common';
import { ONBOARDING_QUERY_PARAM, OnboardingService } from '../onboarding/onboarding.service';
import { OnboardingComponent } from '../onboarding/onboarding.component';

@Component({
  selector: 'app-main',
  imports: [MapComponent, ResultsDrawerComponent, ItemSheetComponent, MenuComponent, SearchBarComponent, FilterSheetComponent, OnboardingComponent],
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
    public state: StateService,
    public onboarding: OnboardingService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.route.params.pipe(
      takeUntilDestroyed(),
    ).subscribe((params) => {
      this.state.workspaceId.set(params['workspaceId']);
      this.api.fetchData(params['workspaceId']).subscribe((workspace) => {
      });

    });
    this.route.fragment.pipe(
      take(1)
    ).subscribe((fragment) => {
      this.state.updateStateFromFragment(fragment);
      this.onboarding.considerTrigger(fragment, this.route.snapshot.queryParamMap.get(ONBOARDING_QUERY_PARAM), this.route);
    });
  }
  ngAfterViewInit() {
    this.platform.browser(() => {
      timer(0).pipe(
        switchMap(() => {
          return this.mapboxService.init;
        })
      ).subscribe(() => {
        this.showMap = true;
      });
    });
  }
}
