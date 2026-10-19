import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { OnboardingQuestionKind, OnboardingService } from './onboarding.service';
import { OnboardingOption, OnboardingQuestionComponent } from './onboarding-question/onboarding-question.component';
import { isConcreteSection } from '../sections';
import { AGE_GROUPS } from '../age-groups';

type OnboardingScreen = 'welcome' | OnboardingQuestionKind;

const ONBOARDING_AGE_GROUP_IDS = ['birth_to_1', '1_to_2', '2_to_3'];

@Component({
  selector: 'app-onboarding',
  imports: [OnboardingQuestionComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.less'
})
export class OnboardingComponent {

  onboarding = inject(OnboardingService);
  api = inject(ApiService);
  state = inject(StateService);

  screen = signal<OnboardingScreen>('welcome');
  cityLogoBroken = signal<boolean>(false);
  // The welcome screen's continue button won't advance until the terms are accepted;
  // trying anyway raises consentMissing, which shows an error above the button.
  termsAccepted = signal<boolean>(false);
  consentMissing = signal<boolean>(false);

  screens = computed<OnboardingScreen[]>(() => ['welcome', ...this.onboarding.questions()]);

  welcomeTitle = computed(() => this.onboarding.config()?.welcome?.title ||
    `ברוכים הבאים למפת הטף של ${this.api.workspace()?.city || ''}`);
  welcomeIntro = computed(() => this.onboarding.config()?.welcome?.intro ||
    'ריכזנו עבורכם את כל מה שצריך לדעת על הגיל הרך (לידה עד 3). מעונות מפוקחים, שירותי בריאות, פנאי וקהילה.');
  welcomeTagline = computed(() => this.onboarding.config()?.welcome?.tagline ||
    'כי אצלנו החינוך הוא מלידה!');

  ageOptions: OnboardingOption[] = [
    ...AGE_GROUPS
      .filter((ag) => ONBOARDING_AGE_GROUP_IDS.includes(ag.id))
      .map((ag) => ({value: ag.id, label: ag.display})),
    {value: '', label: 'כל הגילאים'},
  ];
  interestOptions: OnboardingOption[] = [
    {value: 'education', label: 'מסגרות חינוך'},
    {value: 'health', label: 'בריאות והתפתחות הילד'},
    {value: 'community', label: 'אחה"צ'},
  ];

  acceptTerms(accepted: boolean) {
    this.termsAccepted.set(accepted);
    if (accepted) {
      this.consentMissing.set(false);
    }
  }

  proceed() {
    if (this.termsAccepted()) {
      this.next();
    } else {
      this.consentMissing.set(true);
    }
  }

  next() {
    const screens = this.screens();
    const idx = screens.indexOf(this.screen());
    if (idx >= 0 && idx < screens.length - 1) {
      this.screen.set(screens[idx + 1]);
    } else {
      // Past the last question: straight to the map
      this.onboarding.complete();
    }
  }

  answerAge(value: string | null) {
    this.onboarding.answerAge.set(value || null);
    this.next();
  }

  answerInterest(value: string | null) {
    // The skip option carries no value, which is what leaves the map on הכל.
    this.onboarding.answerInterest.set(isConcreteSection(value) ? value : null);
    this.next();
  }
}
