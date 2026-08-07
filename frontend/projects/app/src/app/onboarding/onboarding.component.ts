import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { OnboardingAddress, OnboardingQuestionKind, OnboardingService } from './onboarding.service';
import { OnboardingOption, OnboardingQuestionComponent } from './onboarding-question/onboarding-question.component';
import { OnboardingAddressComponent } from './onboarding-address/onboarding-address.component';
import { AGE_GROUPS } from '../age-groups';

type OnboardingScreen = 'welcome' | OnboardingQuestionKind | 'final';

const ONBOARDING_AGE_GROUP_IDS = ['birth_to_1', '1_to_2', '2_to_3'];

@Component({
  selector: 'app-onboarding',
  imports: [OnboardingQuestionComponent, OnboardingAddressComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.less'
})
export class OnboardingComponent {

  onboarding = inject(OnboardingService);
  api = inject(ApiService);
  state = inject(StateService);

  screen = signal<OnboardingScreen>('welcome');
  cityLogoBroken = signal<boolean>(false);

  screens = computed<OnboardingScreen[]>(() => ['welcome', ...this.onboarding.questions(), 'final']);

  welcomeTitle = computed(() => this.onboarding.config()?.welcome?.title ||
    `ברוכים הבאים למפת הטף של ${this.api.workspace()?.city || ''}`);
  welcomeIntro = computed(() => this.onboarding.config()?.welcome?.intro ||
    'ריכזנו עבורכם את כל מה שצריך לדעת על הגיל הרך (לידה עד 3). מעונות מפוקחים, שירותי בריאות, פנאי וקהילה.');
  welcomeTagline = computed(() => this.onboarding.config()?.welcome?.tagline ||
    'כי אצלנו החינוך הוא מלידה!');
  welcomePrompt = computed(() => this.onboarding.config()?.welcome?.prompt ||
    'אספנו הרבה מידע ויש המון מה לדעת, מאיפה נתחיל?');
  // "מעולה!" if the user answered anything, "אנחנו על זה!" otherwise
  finalTitle = computed(() => {
    const answered = this.onboarding.answerAge() || this.onboarding.answerInterest() || this.onboarding.answerAddress();
    return answered ? 'מעולה!' : 'אנחנו על זה!';
  });
  disclaimerText = computed(() => this.onboarding.config()?.disclaimer?.text ||
    'רגע לפני שמעבירים אותך לאפליקציה חשוב לנו להדגיש כי המידע מוגש כשירות לציבור ואינו מהווה המלצה');

  ageOptions: OnboardingOption[] = [
    ...AGE_GROUPS
      .filter((ag) => ONBOARDING_AGE_GROUP_IDS.includes(ag.id))
      .map((ag) => ({value: ag.id, label: ag.display})),
    {value: '', label: 'כל הגילאים'},
  ];
  interestOptions: OnboardingOption[] = [
    {value: 'education', label: 'מסגרות חינוך'},
    {value: 'health', label: 'בריאות והתפתחות הילד'},
    {value: 'community', label: 'פנאי וקהילה'},
  ];

  next() {
    const screens = this.screens();
    const idx = screens.indexOf(this.screen());
    if (idx >= 0 && idx < screens.length - 1) {
      this.screen.set(screens[idx + 1]);
    }
  }

  answerAge(value: string | null) {
    this.onboarding.answerAge.set(value || null);
    this.next();
  }

  answerInterest(value: string | null) {
    this.onboarding.answerInterest.set(value);
    this.next();
  }

  answerAddress(value: OnboardingAddress | null) {
    this.onboarding.answerAddress.set(value);
    this.next();
  }

  dismiss() {
    this.onboarding.dismiss();
  }

  complete() {
    this.onboarding.complete();
  }
}
