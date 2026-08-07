import { Component, input, output, signal } from '@angular/core';

export type OnboardingOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-onboarding-question',
  imports: [],
  templateUrl: './onboarding-question.component.html',
  styleUrl: './onboarding-question.component.less'
})
export class OnboardingQuestionComponent {

  title = input.required<string>();
  options = input.required<OnboardingOption[]>();
  selected = output<string | null>();

  picked = signal<string | null>(null);

  pick(value: string) {
    if (this.picked() !== null) {
      return;
    }
    this.picked.set(value);
    // Let the selected state paint before advancing
    setTimeout(() => this.selected.emit(value), 250);
  }

  skip() {
    this.selected.emit(null);
  }
}
