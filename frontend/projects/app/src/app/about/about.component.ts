import { Component, signal } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { sign } from 'crypto';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [HeaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.less'
})
export class AboutComponent {
  section = signal<string>('');

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.section.set(params['section']);
    });
  }
}
