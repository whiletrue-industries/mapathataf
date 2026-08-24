import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OnboardingService } from './onboarding.service';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let api: ApiService;
  let state: StateService;
  let route: ActivatedRoute;

  function setup(platformId: string = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideRouter([]), {provide: PLATFORM_ID, useValue: platformId},
      ],
    });
    service = TestBed.inject(OnboardingService);
    api = TestBed.inject(ApiService);
    state = TestBed.inject(StateService);
    route = TestBed.inject(ActivatedRoute);
    state.workspaceId.set('dymonh');
    api.workspace.set({city: 'דימונה', onboarding: {enabled: true}});
  }

  describe('trigger gating', () => {
    it('shows when the param is present and there is no fragment', () => {
      setup();
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeTrue();
    });

    it('treats an empty param value as present', () => {
      setup();
      service.considerTrigger(null, '', route);
      expect(service.visible()).toBeTrue();
    });

    it('does not show when the param is absent', () => {
      setup();
      service.considerTrigger(null, null, route);
      expect(service.visible()).toBeFalse();
    });

    it('does not show when a fragment is present', () => {
      setup();
      service.considerTrigger('education/34.5/31.5/14/////', '1', route);
      expect(service.visible()).toBeFalse();
    });

    it('does not show when the workspace has no onboarding config', () => {
      setup();
      api.workspace.set({city: 'דימונה'});
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeFalse();
    });

    it('does not show when onboarding is disabled for the workspace', () => {
      setup();
      api.workspace.set({city: 'דימונה', onboarding: {enabled: false}});
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeFalse();
    });

    it('shows once the workspace document arrives after the trigger', () => {
      setup();
      api.workspace.set({});
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeFalse();
      api.workspace.set({city: 'דימונה', onboarding: {enabled: true}});
      expect(service.visible()).toBeTrue();
    });

    it('shows again on a repeat visit with the param', () => {
      setup();
      service.considerTrigger(null, '1', route);
      service.dismiss();
      expect(service.visible()).toBeFalse();
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeTrue();
    });

    it('never arms on the server', () => {
      setup('server');
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeFalse();
    });
  });

  describe('questions', () => {
    it('defaults to all questions', () => {
      setup();
      expect(service.questions()).toEqual(['age', 'interest']);
    });

    it('follows the configured question list and drops unknown kinds', () => {
      setup();
      api.workspace.set({onboarding: {enabled: true, questions: ['interest', 'bogus', 'age']}});
      expect(service.questions()).toEqual(['interest', 'age']);
    });
  });

  describe('dismiss and complete', () => {
    beforeEach(() => {
      setup();
      service.considerTrigger(null, '1', route);
    });

    it('dismiss hides without touching filters', () => {
      service.dismiss();
      expect(service.visible()).toBeFalse();
      expect(state.filterAgeGroup()).toBeNull();
      expect(state.section()).toEqual('all');
    });

    it('complete applies the collected answers', () => {
      service.answerAge.set('1_to_2');
      service.answerInterest.set('health');
      service.complete();
      expect(service.visible()).toBeFalse();
      expect(state.filterAgeGroup()).toEqual(['1_to_2']);
      expect(state.section()).toEqual('health');
    });

    it('complete leaves the age filter empty for skipped or all-ages answers', () => {
      service.complete();
      expect(state.filterAgeGroup()).toBeNull();
      expect(state.section()).toEqual('all');
    });

    it('complete leaves the map at its default view', () => {
      service.complete();
      expect(state.askZoom()).toBeNull();
    });
  });
});
