import { computed, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { PlatformService } from '../platform.service';
import { MapboxService } from '../mapbox.service';

export type OnboardingQuestionKind = 'age' | 'interest' | 'address';

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

export type OnboardingAddress = {
  name: string;
  center: [number, number];
};

export const ONBOARDING_QUERY_PARAM = 'onboarding';
const STORAGE_KEY_PREFIX = 'mapathataf-onboarding-done-';
const QUESTION_KINDS: OnboardingQuestionKind[] = ['age', 'interest', 'address'];

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  triggerArmed = signal<boolean>(false);
  answerAge = signal<string | null>(null);
  answerInterest = signal<string | null>(null);
  answerAddress = signal<OnboardingAddress | null>(null);

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
    private mapbox: MapboxService,
    private router: Router,
  ) {}

  // Called with the load-time fragment (before the state effect populates the hash)
  considerTrigger(fragment: string | null, param: string | null, route: ActivatedRoute) {
    this.route = route;
    if (this.platform.browser() && param !== null && !fragment && !this.seen()) {
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
    const address = this.answerAddress();
    if (address) {
      if (this.mapbox.map) {
        this.mapbox.map.flyTo({center: address.center, zoom: 16});
      } else {
        this.state.askZoom.set([address.center[0], address.center[1], 16]);
      }
    }
  }

  // Marks as seen and strips the query param before any answer is applied, so the
  // state effect's subsequent navigate (queryParamsHandling: 'preserve') keeps the
  // stripped params.
  private close() {
    this.markSeen();
    this.triggerArmed.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {[ONBOARDING_QUERY_PARAM]: null},
      queryParamsHandling: 'merge',
      preserveFragment: true,
      replaceUrl: true,
    });
  }

  private storageKey(): string {
    return STORAGE_KEY_PREFIX + this.state.workspaceId();
  }

  private seen(): boolean {
    try {
      return localStorage.getItem(this.storageKey()) !== null;
    } catch (e) {
      return false;
    }
  }

  private markSeen() {
    try {
      localStorage.setItem(this.storageKey(), new Date().toISOString());
    } catch (e) {
      // localStorage unavailable - the overlay may show again next visit
    }
  }
}
