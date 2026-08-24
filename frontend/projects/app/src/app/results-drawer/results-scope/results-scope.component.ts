import { Component, inject } from '@angular/core';
import { MapScope, StateService } from '../../state.service';

@Component({
  selector: 'app-results-scope',
  imports: [],
  templateUrl: './results-scope.component.html',
  styleUrl: './results-scope.component.less'
})
export class ResultsScopeComponent {

  state = inject(StateService);

  setScope(scope: MapScope) {
    this.state.mapScope.set(scope);
  }
}
