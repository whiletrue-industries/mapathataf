import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MenuComponent } from './menu.component';
import { OnboardingService } from '../onboarding/onboarding.service';
import { MapboxService } from '../mapbox.service';

describe('MenuComponent', () => {
  let back: jasmine.Spy;

  beforeEach(() => {
    history.replaceState({navigationId: 1}, '');
    back = spyOn(history, 'back');
    TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        provideHttpClient(), provideRouter([]),
        // mapbox-gl registers a global RTL plugin that cannot be initialized once per test
        {provide: MapboxService, useValue: {map: null}},
      ],
    });
  });

  afterEach(() => history.replaceState(null, ''));

  function create() {
    const fixture = TestBed.createComponent(MenuComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('opens onto a history entry of its own, keeping the router\'s bookkeeping', () => {
    const fixture = create();
    const before = history.length;
    fixture.componentInstance.openMenu();
    fixture.detectChanges();
    expect(history.length).toBe(before + 1);
    expect(history.state.menu).toBeTrue();
    expect(history.state.navigationId).toBe(1);
    expect(fixture.nativeElement.querySelector('app-menu-page')).not.toBeNull();
  });

  it('closes on back', () => {
    const fixture = create();
    fixture.componentInstance.openMenu();
    history.replaceState({navigationId: 1}, '');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(fixture.componentInstance.open()).toBeFalse();
  });

  it('takes its entry off the stack when closed from the inside', () => {
    const fixture = create();
    fixture.componentInstance.openMenu();
    fixture.componentInstance.closeMenu();
    expect(back).toHaveBeenCalled();
    expect(fixture.componentInstance.open()).toBeFalse();
  });

  it('starts open on an entry it flagged, as when coming back from a content page', () => {
    history.replaceState({navigationId: 2, menu: true}, '');
    expect(create().componentInstance.open()).toBeTrue();
  });

  it('dismisses the onboarding tip when opened', () => {
    const fixture = create();
    const onboarding = TestBed.inject(OnboardingService);
    onboarding.menuTipVisible.set(true);
    fixture.componentInstance.openMenu();
    expect(onboarding.menuTipVisible()).toBeFalse();
  });
});
