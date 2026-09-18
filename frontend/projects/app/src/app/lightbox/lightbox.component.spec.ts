import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LightboxComponent } from './lightbox.component';
import { LightboxService } from './lightbox.service';

// 1x1 transparent gif
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

describe('LightboxService', () => {
  let service: LightboxService;
  let back: jasmine.Spy;

  beforeEach(() => {
    back = spyOn(history, 'back');
    service = TestBed.inject(LightboxService);
  });

  it('clamps the opening index into range', () => {
    service.open(['a', 'b'], 7);
    expect(service.content()?.index).toBe(1);
    service.open(['a', 'b'], -2);
    expect(service.content()?.index).toBe(0);
  });

  it('does not open with nothing to show', () => {
    service.open([]);
    expect(service.content()).toBeNull();
  });

  it('closes', () => {
    service.open(['a']);
    service.close();
    expect(service.content()).toBeNull();
  });

  describe('back button', () => {
    it('opens onto a history entry of its own, at the same URL', () => {
      const url = location.href;
      const before = history.length;
      service.open(['a']);
      expect(history.state.lightbox).toBeTrue();
      expect(history.length).toBe(before + 1);
      expect(location.href).toBe(url);
    });

    it('keeps what the router had stored on the entry', () => {
      history.replaceState({ navigationId: 7 }, '');
      service.open(['a']);
      expect(history.state.navigationId).toBe(7);
    });

    it('pushes once, however many times it is opened', () => {
      const push = spyOn(history, 'pushState').and.callThrough();
      service.open(['a', 'b'], 0);
      service.open(['a', 'b'], 1);
      expect(push).toHaveBeenCalledTimes(1);
    });

    it('closes when the browser goes back, without going back a second time', () => {
      service.open(['a']);
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(service.content()).toBeNull();
      expect(back).not.toHaveBeenCalled();
    });

    it('takes its entry off the stack when closed from the inside', () => {
      service.open(['a']);
      service.close();
      expect(back).toHaveBeenCalledTimes(1);
    });

    it('leaves the history alone if the router has navigated since it opened', () => {
      service.open(['a']);
      history.replaceState({ navigationId: 8 }, '');
      service.close();
      expect(back).not.toHaveBeenCalled();
    });

    it('does not touch the history when closed while already closed', () => {
      service.close();
      expect(back).not.toHaveBeenCalled();
    });
  });
});

describe('LightboxComponent', () => {
  let service: LightboxService;
  let fixture: ComponentFixture<LightboxComponent>;
  let element: HTMLElement;

  beforeEach(() => spyOn(history, 'back'));

  function open(photos: string[], index = 0) {
    service = TestBed.inject(LightboxService);
    service.open(photos, index, 'גן חלומותיי');
    fixture = TestBed.createComponent(LightboxComponent);
    element = fixture.nativeElement;
    // Give the track a real width, so scroll offsets mean something.
    element.style.cssText = 'position: fixed; top: 0; left: 0; width: 400px; height: 300px;';
    fixture.detectChanges();
  }

  function press(key: string) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  it('renders one slide per photo, with a described image', () => {
    open([PIXEL, PIXEL, PIXEL]);
    const images = element.querySelectorAll<HTMLImageElement>('.slide img');
    expect(images.length).toBe(3);
    expect(images[1].alt).toBe('גן חלומותיי - תמונה 2 מתוך 3');
    expect(element.querySelector('.counter')?.textContent?.trim()).toBe('1 / 3');
  });

  it('offers no navigation for a single photo', () => {
    open([PIXEL]);
    expect(element.querySelector('.nav')).toBeNull();
    expect(element.querySelector('.counter')).toBeNull();
  });

  it('closes on Escape', () => {
    open([PIXEL, PIXEL]);
    press('Escape');
    expect(service.content()).toBeNull();
  });

  it('closes on a click around the photo but not on the photo', () => {
    open([PIXEL]);
    element.querySelector<HTMLElement>('.slide img')!.click();
    expect(service.content()).not.toBeNull();
    element.querySelector<HTMLElement>('.slide')!.click();
    expect(service.content()).toBeNull();
  });

  it('hands the focus back to whatever opened it', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    service = TestBed.inject(LightboxService);
    service.open([PIXEL], 0, '', opener);
    fixture = TestBed.createComponent(LightboxComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('closes from the close button', () => {
    open([PIXEL]);
    element.querySelector<HTMLElement>('.close')!.click();
    expect(service.content()).toBeNull();
  });

  it('derives the index from where the track is scrolled to', () => {
    open([PIXEL, PIXEL, PIXEL]);
    const track = element.querySelector<HTMLElement>('.track')!;
    const sign = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
    track.scrollLeft = sign * 2 * track.clientWidth;
    fixture.componentInstance.onScroll();
    fixture.detectChanges();
    expect(fixture.componentInstance.index()).toBe(2);
    expect(element.querySelector('.counter')?.textContent?.trim()).toBe('3 / 3');
    expect(element.querySelector<HTMLButtonElement>('.next')!.disabled).toBeTrue();
    expect(element.querySelector<HTMLButtonElement>('.prev')!.disabled).toBeFalse();
  });

  it('scrolls the track one photo over for next / previous', () => {
    open([PIXEL, PIXEL, PIXEL]);
    const track = element.querySelector<HTMLElement>('.track')!;
    const scrollTo = spyOn(track, 'scrollTo');
    fixture.componentInstance.go(1);
    const sign = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
    expect(scrollTo.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ left: sign * track.clientWidth }));
  });

  it('locks the track while a photo is zoomed, and unzooms before moving on', () => {
    open([PIXEL, PIXEL]);
    const image = element.querySelector<HTMLElement>('.slide img')!;
    image.dispatchEvent(new MouseEvent('dblclick', { clientX: 10, clientY: 10 }));
    fixture.detectChanges();
    expect(image.classList).toContain('zoomed');
    expect(element.querySelector('.track')!.classList).toContain('locked');

    element.querySelector<HTMLElement>('.slide')!.click();
    expect(service.content()).withContext('a click around a zoomed photo').not.toBeNull();

    fixture.componentInstance.go(1);
    fixture.detectChanges();
    expect(image.classList).not.toContain('zoomed');
    expect(element.querySelector('.track')!.classList).not.toContain('locked');
  });

  it('does not scroll past either end', () => {
    open([PIXEL, PIXEL]);
    const scrollTo = spyOn(element.querySelector<HTMLElement>('.track')!, 'scrollTo');
    fixture.componentInstance.go(-1);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
