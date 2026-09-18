import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { routes } from '../app.routes';
import { ItemListItemComponent } from './item-list-item.component';

describe('ItemListItemComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemListItemComponent],
      providers: [
        provideRouter(routes),
        { provide: ApiService, useValue: { workspaceId: signal('rkhobot') } },
      ],
    });
  });

  // The list lives at /:workspaceId/items but items are edited at /:workspaceId/:itemId, so a
  // link relative to the list resolves to /:workspaceId/items/:itemId, which matches no route.
  it('links to the item editor, not to a path under the list', () => {
    const fixture = TestBed.createComponent(ItemListItemComponent);
    fixture.componentInstance.item = { id: '8dda400a', resolved: { name: 'טיפת חלב אהרוני' }, admin: {}, user: {} };
    fixture.detectChanges();
    const href = fixture.nativeElement.querySelector('a.card').getAttribute('href');
    expect(href).toBe('/rkhobot/8dda400a');
    const segments = TestBed.inject(Router).parseUrl(href).root.children['primary'].segments;
    expect(segments.length).toBe(2);
  });
});
