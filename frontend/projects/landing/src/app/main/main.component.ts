import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main',
  imports: [
    HeaderComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.less'
})
export class MainComponent {

}
