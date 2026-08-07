import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { BASE_URL } from './api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(BASE_URL)) {
    return next(req);
  }
  const auth = inject(AuthService);
  return from(auth.token()).pipe(
    switchMap((token) => next(
      token ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}}) : req
    )),
  );
};
