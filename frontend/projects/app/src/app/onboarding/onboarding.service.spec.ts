import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OnboardingService } from './onboarding.service';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { MapboxService } from '../mapbox.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let api: ApiService;
  let state: StateService;
  let route: ActivatedRoute;
  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;

  function setup(platformId: string = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideRouter([]), {provide: PLATFORM_ID, useValue: platformId},
        // mapbox-gl registers a global RTL plugin that cannot be initialized once per test
        {provide: MapboxService, useValue: {map: null}},
      ],
    });
    service = TestBed.inject(OnboardingService);
    api = TestBed.inject(ApiService);
    state = TestBed.inject(StateService);
    route = TestBed.inject(ActivatedRoute);
    state.workspaceId.set('dymonh');
    api.workspace.set({city: 'דימונה', onboarding: {enabled: true}});
  }

  beforeEach(() => {
    getItemSpy = spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    setItemSpy = spyOn(Storage.prototype, 'setItem');
  });

  describe('trigger gating', () => {
    it('shows when the param is present, there is no fragment and it was not seen', () => {
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

    it('does not show when already seen in this browser', () => {
      getItemSpy.and.returnValue('2026-08-07T00:00:00.000Z');
      setup();
      service.considerTrigger(null, '1', route);
      expect(service.visible()).toBeFalse();
      expect(getItemSpy).toHaveBeenCalledWith('mapathataf-onboarding-done-dymonh');
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

    it('arms when localStorage is unavailable', () => {
      getItemSpy.and.throwError('denied');
      setup();
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
      expect(service.questions()).toEqual(['age', 'interest', 'address']);
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

    it('dismiss marks as seen and hides without touching filters', () => {
      service.dismiss();
      expect(service.visible()).toBeFalse();
      expect(setItemSpy).toHaveBeenCalledWith('mapathataf-onboarding-done-dymonh', jasmine.any(String));
      expect(state.filterAgeGroup()).toBeNull();
      expect(state.section()).toEqual('education');
    });

    it('complete applies the collected answers', () => {
      service.answerAge.set('1_to_2');
      service.answerInterest.set('health');
      service.complete();
      expect(service.visible()).toBeFalse();
      expect(setItemSpy).toHaveBeenCalledWith('mapathataf-onboarding-done-dymonh', jasmine.any(String));
      expect(state.filterAgeGroup()).toEqual(['1_to_2']);
      expect(state.section()).toEqual('health');
    });

    it('complete leaves the age filter empty for skipped or all-ages answers', () => {
      service.complete();
      expect(state.filterAgeGroup()).toBeNull();
      expect(state.section()).toEqual('education');
    });

    it('complete asks the map to zoom to the chosen address when the map is not ready', () => {
      service.answerAddress.set({name: 'תמר, דימונה', center: [35.03, 31.07]});
      service.complete();
      expect(state.askZoom()).toEqual([35.03, 31.07, 16]);
    });
  });
});
