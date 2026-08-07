import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  function setup(user: any, ready = true) {
    const fakeAuth = {user: signal(user), ready: signal(ready)};
    TestBed.configureTestingModule({
      providers: [provideRouter([]), {provide: AuthService, useValue: fakeAuth}],
    });
    return fakeAuth;
  }

  function run(): Promise<any> {
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    return isObservable(result) ? firstValueFrom(result as Observable<any>) : Promise.resolve(result);
  }

  it('allows access for a signed-in user', async () => {
    setup({email: 'root@example.com'});
    expect(await run()).toBeTrue();
  });

  it('redirects to /login when signed out', async () => {
    setup(null);
    const result = await run();
    expect(result instanceof UrlTree).toBeTrue();
    expect(result.toString()).toEqual('/login');
  });

  it('waits for auth readiness before deciding', async () => {
    const fakeAuth = setup(null, false);
    const pending = run();
    fakeAuth.user.set({email: 'root@example.com'});
    fakeAuth.ready.set(true);
    expect(await pending).toBeTrue();
  });
});
