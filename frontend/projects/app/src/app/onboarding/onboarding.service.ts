import { computed, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { ConcreteSection } from '../sections';
import { PlatformService } from '../platform.service';

export type OnboardingQuestionKind = 'age' | 'interest';

export type OnboardingConfig = {
  enabled?: boolean;
  questions?: OnboardingQuestionKind[];
  welcome?: {
    title?: string;
    intro?: string;
    tagline?: string;
    prompt?: string;
  };
  disclaimer?: {
    text?: string;
  };
};

export const ONBOARDING_QUERY_PARAM = 'onboarding';
const QUESTION_KINDS: OnboardingQuestionKind[] = ['age', 'interest'];

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  triggerArmed = signal<boolean>(false);
  answerAge = signal<string | null>(null);
  answerInterest = signal<ConcreteSection | null>(null);

  config = computed<OnboardingConfig | null>(() => this.api.workspace()?.onboarding || null);
  visible = computed(() => this.triggerArmed() && !!this.config()?.enabled);
  questions = computed<OnboardingQuestionKind[]>(() => {
    const questions = this.config()?.questions || QUESTION_KINDS;
    return questions.filter((q) => QUESTION_KINDS.includes(q));
  });

  private route: ActivatedRoute | null = null;

  constructor(
    private platform: PlatformService,
    private api: ApiService,
    private state: StateService,
    private router: Router,
  ) {}

  // Called with the load-time fragment (before the state effect populates the hash)
  considerTrigger(fragment: string | null, param: string | null, route: ActivatedRoute) {
    this.route = route;
    if (this.platform.browser() && param !== null && !fragment) {
      this.triggerArmed.set(true);
    }
  }

  dismiss() {
    this.close();
  }

  complete() {
    this.close();
    const age = this.answerAge();
    if (age) {
      this.state.filterAgeGroup.set([age]);
    }
    const interest = this.answerInterest();
    if (interest) {
      this.state.section.set(interest);
    }
  }

  // Strips the query param before any answer is applied, so the state effect's
  // subsequent navigate (queryParamsHandling: 'preserve') keeps the stripped params.
  private close() {
    this.triggerArmed.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {[ONBOARDING_QUERY_PARAM]: null},
      queryParamsHandling: 'merge',
      preserveFragment: true,
      replaceUrl: true,
    });
  }
}
