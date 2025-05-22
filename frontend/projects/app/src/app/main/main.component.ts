import { AfterViewInit, Component } from '@angular/core';
import { MapComponent } from "../map/map.component";
import { PlatformService } from '../platform.service';
import { After } from 'v8';
import { timer } from 'rxjs';

@Component({
  selector: 'app-main',
  imports: [MapComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.less'
})
export class MainComponent implements AfterViewInit{
  showMap = false;
  constructor(private platform: PlatformService) {
    console.log('MainComponent constructor');
  }

  ngAfterViewInit() {
    this.platform.browser(() => {
      timer(0).subscribe(() => {
        console.log('MainComponent browser');
        this.showMap = true;
      });
    });
  }
}
