import { buildOnboarding, flattenOnboarding } from './city-edit.component';

describe('onboarding flatten/build round-trip', () => {
  const onboarding = {
    enabled: true,
    questions: ['age', 'interest'],
    welcome: {title: 'שלום', intro: 'ברוכים הבאים', tagline: 'סלוגן', prompt: 'מאיפה נתחיל?'},
    disclaimer: {text: 'הבהרה'},
  };

  it('round-trips a full config', () => {
    expect(buildOnboarding(flattenOnboarding(onboarding))).toEqual(onboarding);
  });

  it('flattens a missing config to disabled defaults', () => {
    const flat = flattenOnboarding(undefined);
    expect(flat.enabled).toBeFalse();
    expect(flat.welcome_title).toBeUndefined();
  });

  it('applies a nested-field patch without losing siblings', () => {
    const merged = {...flattenOnboarding(onboarding), welcome_intro: 'טקסט חדש'};
    expect(buildOnboarding(merged)).toEqual({
      ...onboarding,
      welcome: {...onboarding.welcome, intro: 'טקסט חדש'},
    });
  });

  it('omits empty welcome/disclaimer objects', () => {
    expect(buildOnboarding({enabled: true})).toEqual({enabled: true});
  });
});
