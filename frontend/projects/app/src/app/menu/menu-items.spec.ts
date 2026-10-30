import { cityMenuItems, cityPage, cityPageTitle, GENERAL_MENU_ITEMS } from './menu-items';

describe('menu items', () => {
  it('lists the shared pages and the missing-facility report above the divider', () => {
    expect(GENERAL_MENU_ITEMS.map((item) => item.title)).toEqual(['איך לבחור מסגרת חינוכית?', 'קישורים שימושיים', 'דווחו לנו על מסגרת חסרה']);
  });

  it('lists nothing for a city without a page or links', () => {
    expect(cityMenuItems({city: 'דימונה', links: null}, 'dymonh')).toEqual([]);
  });

  it('orders the city page, external links, then WhatsApp; skips internal links', () => {
    const workspace = {
      city: 'רחובות',
      city_page: {content: '## שלום'},
      links: [
        {kind: 'whatsapp', href: 'https://chat.whatsapp.com/x', title: 'קבוצה עם שם ארוך'},
        {kind: 'internal', href: 'munis/rehovot', title: 'הגיל הרך ברחובות'},
        {kind: 'external', href: 'https://example.org', title: 'מרכז גיל רך'},
      ],
    };
    expect(cityMenuItems(workspace, 'rkhobot')).toEqual([
      {title: 'הגיל הרך ברחובות', routerLink: ['/about', 'city'], queryParams: {workspace: 'rkhobot'}},
      {title: 'מרכז גיל רך', href: 'https://example.org'},
      {title: 'קהילה ועידכונים', href: 'https://chat.whatsapp.com/x', whatsapp: true},
    ]);
  });

  it('only counts a city page that has content', () => {
    expect(cityPage({city_page: {title: 'כותרת', content: '  '}})).toBeNull();
    expect(cityPage({city_page: {content: 'x'}})).toEqual({content: 'x'});
  });

  it('titles the city page from the document, or after the city', () => {
    expect(cityPageTitle({city: 'חיפה', city_page: {title: 'חיפה מלידה', content: 'x'}})).toEqual('חיפה מלידה');
    expect(cityPageTitle({city: 'חיפה', city_page: {content: 'x'}})).toEqual('הגיל הרך בחיפה');
  });
});
