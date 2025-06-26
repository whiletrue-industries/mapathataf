import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  // Signals to hold the filtering state
  facilityKind = signal('all');
  itemSource = signal('all');
  appPublication = signal('all');
  adminUpdated = signal('all');
  userUpdated = signal('all');
  licensingStatus = signal('all');
  mentoringType = signal('all');

  filterState = computed(() => 
    `${this.facilityKind()}-${this.itemSource()}-${this.appPublication()}-${this.adminUpdated()}-${this.userUpdated()}`
  );
}
