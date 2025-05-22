import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {

  safari = false;
  ios = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.browser(() => {
      const stringWithPlatform = window.navigator?.platform || window.navigator?.userAgent;

      if (stringWithPlatform.indexOf('Safari') != -1 && 
          stringWithPlatform.indexOf('Chrome') == -1) {
        this.safari = true;
      }

      if (/iPad|iPhone|iPod/.test(stringWithPlatform)) {
        this.ios = true;
      } else {
        // The new iPad return MacIntel as platform and Macintosh as userAgent
        // so the way to differentiate iPad vs mac is by checking if
        // Touch Events exist on the document
        const hasTouchEvents = 'ontouchend' in document;
        if (/Mac/.test(stringWithPlatform) && hasTouchEvents) {
          this.ios = true;
        }
      }
    });
  }

  browser<T>(callable?: () => void): boolean {
    if (isPlatformBrowser(this.platformId)) {
      if (callable) {
        callable();
      }
      return true;
    }
    return false;
  }

  server<T>(callable?: () => void): boolean {
    if (isPlatformServer(this.platformId)) {
      if (callable) {
        callable();
      }
      return true;
    }
    return false;
  }
}
