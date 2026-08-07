import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { BASE_URL } from './api.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {provide: AuthService, useValue: {token: () => Promise.resolve('id-token-1')}},
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds a Bearer header to API requests', async () => {
    const request = http.get(`${BASE_URL}/manage/workspaces`).subscribe();
    await Promise.resolve();
    const req = controller.expectOne(`${BASE_URL}/manage/workspaces`);
    expect(req.request.headers.get('Authorization')).toEqual('Bearer id-token-1');
    req.flush([]);
    request.unsubscribe();
  });

  it('leaves non-API requests untouched', () => {
    const request = http.get('https://example.com/x').subscribe();
    const req = controller.expectOne('https://example.com/x');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
    request.unsubscribe();
  });
});
