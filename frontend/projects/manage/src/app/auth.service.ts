import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { FIREBASE_CONFIG } from './firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user = signal<User | null>(null);
  ready = signal<boolean>(false);

  private auth: Auth | null = null;

  constructor() {
    // Firebase must only initialize in the browser - on the server the app
    // renders a neutral shell and hydration takes over
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const app = initializeApp(FIREBASE_CONFIG);
      this.auth = getAuth(app);
      onIdTokenChanged(this.auth, (user) => {
        this.user.set(user);
        this.ready.set(true);
      });
    }
  }

  signIn() {
    if (this.auth) {
      signInWithPopup(this.auth, new GoogleAuthProvider());
    }
  }

  async signOut() {
    if (this.auth) {
      await signOut(this.auth);
    }
    this.user.set(null);
  }

  token(): Promise<string | null> {
    const user = this.user();
    return user ? user.getIdToken() : Promise.resolve(null);
  }
}
