import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { OnboardingComponent } from './onboarding.component';
import { OnboardingService } from './onboarding.service';
import { ApiService } from '../api.service';
import { MapboxService } from '../mapbox.service';

describe('OnboardingComponent', () => {
  let api: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [
        provideHttpClient(), provideRouter([]),
        // mapbox-gl registers a global RTL plugin that cannot be initialized once per test
        {provide: MapboxService, useValue: {map: null}},
      ],
    });
    api = TestBed.inject(ApiService);
    api.workspace.set({city: 'דימונה', onboarding: {enabled: true}});
  });

  function create(): OnboardingComponent {
    const fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('walks welcome and all questions by default', () => {
    const component = create();
    expect(component.screens()).toEqual(['welcome', 'age', 'interest']);
  });

  it('only shows the configured questions, then completes', () => {
    api.workspace.set({city: 'דימונה', onboarding: {enabled: true, questions: ['interest']}});
    const component = create();
    const onboarding = TestBed.inject(OnboardingService);
    const complete = spyOn(onboarding, 'complete');
    expect(component.screens()).toEqual(['welcome', 'interest']);
    expect(component.screen()).toEqual('welcome');
    component.next();
    expect(component.screen()).toEqual('interest');
    expect(complete).not.toHaveBeenCalled();
    component.next();
    expect(complete).toHaveBeenCalled();
  });

  it('will not continue until the terms are accepted, and says so', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;
    const checkbox = el.querySelector<HTMLInputElement>('.consent input')!;
    expect(checkbox.checked).toBeFalse();
    expect(el.querySelector('.consent-error')).toBeNull();

    el.querySelector<HTMLButtonElement>('.button.primary')!.click();
    fixture.detectChanges();
    expect(component.screen()).toEqual('welcome');
    expect(el.querySelector('.consent-error')).not.toBeNull();

    checkbox.click();
    fixture.detectChanges();
    expect(el.querySelector('.consent-error')).toBeNull();
    el.querySelector<HTMLButtonElement>('.button.primary')!.click();
    expect(component.screen()).toEqual('age');
  });

  it('uses the configured welcome texts when present', () => {
    api.workspace.set({city: 'דימונה', onboarding: {enabled: true, welcome: {title: 'שלום', intro: 'ברוכים הבאים'}}});
    const component = create();
    expect(component.welcomeTitle()).toEqual('שלום');
    expect(component.welcomeIntro()).toEqual('ברוכים הבאים');
  });

  it('falls back to a welcome title derived from the city name', () => {
    const component = create();
    expect(component.welcomeTitle()).toEqual('ברוכים הבאים למפת הטף של דימונה');
  });

  it('records answers and advances', () => {
    const component = create();
    const onboarding = TestBed.inject(OnboardingService);
    component.next();
    expect(component.screen()).toEqual('age');
    component.answerAge('1_to_2');
    expect(onboarding.answerAge()).toEqual('1_to_2');
    expect(component.screen()).toEqual('interest');
  });

  it('stores no age answer for the all-ages option', () => {
    const component = create();
    const onboarding = TestBed.inject(OnboardingService);
    component.answerAge('');
    expect(onboarding.answerAge()).toBeNull();
  });

  it('skipping a question records no answer and advances', () => {
    const component = create();
    const onboarding = TestBed.inject(OnboardingService);
    component.next();
    component.answerAge(null);
    expect(onboarding.answerAge()).toBeNull();
    expect(component.screen()).toEqual('interest');
  });
});
