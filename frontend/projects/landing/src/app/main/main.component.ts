import { afterNextRender, Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';

type CityLogo = {
  city: string;
  id: string;
  logo_url: string;
};

@Component({
  selector: 'app-main',
  imports: [
    HeaderComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.less'
})
export class MainComponent {

  LOGOS_URL = 'https://api-m5crpfzdeq-ez.a.run.app/logos';
  SCROLL_SPEED = 25; // pixels per second

  cityLogos = signal<CityLogo[]>([]);
  leftLogos = computed(() => this.cityLogos().slice(0, Math.ceil(this.cityLogos().length / 2)));
  rightLogos = computed(() => this.cityLogos().slice(Math.ceil(this.cityLogos().length / 2)));
  scrolling = signal(false);
  scrollDuration = signal('60s');

  logosEl = viewChild<ElementRef<HTMLElement>>('logosEl');
  logoSetEl = viewChild<ElementRef<HTMLElement>>('logoSetEl');
  resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.fetchLogos();
      this.resizeObserver = new ResizeObserver(() => this.checkOverflow());
      this.resizeObserver.observe(this.logosEl()?.nativeElement as Element);
    });
  }

  async fetchLogos() {
    try {
      const logos: CityLogo[] = await (await fetch(this.LOGOS_URL)).json();
      // Rehovot is already featured in the middle of the partners row
      this.cityLogos.set(logos.filter((logo) => logo.id !== 'rkhobot'));
    } catch (e) {
      console.error('Failed to fetch city logos', e);
    }
  }

  removeLogo(logo: CityLogo) {
    this.cityLogos.update((logos) => logos.filter((l) => l.id !== logo.id));
    this.checkOverflow();
  }

  checkOverflow() {
    const container = this.logosEl()?.nativeElement;
    const set = this.logoSetEl()?.nativeElement;
    if (!container || !set) {
      return;
    }
    const setWidth = set.scrollWidth;
    if (setWidth > container.clientWidth + 1) {
      this.scrollDuration.set(`${Math.round(setWidth / this.SCROLL_SPEED)}s`);
      this.scrolling.set(true);
    } else {
      this.scrolling.set(false);
    }
  }
}
