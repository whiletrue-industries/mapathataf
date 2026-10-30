// What the full-page menu lists. Above the divider: pages every city shares. Below it,
// only what the city's workspace document provides: its own page (`city_page`), its
// external links and its WhatsApp group (from `links`). Muni `internal` links are the
// pre-`city_page` way of pointing at a city page and are not listed.

export type MenuItem = {
  title: string;
  // An in-app page...
  routerLink?: any[];
  queryParams?: {[key: string]: string};
  // ...or a link out, opened in a new tab
  href?: string;
  whatsapp?: boolean;
};

export type CityPage = {
  title?: string;
  subtitle?: string;
  content?: string;
};

// Set on the history entry of a page opened from the menu, so its close button knows that
// going back lands on the menu (see AboutComponent.close)
export const FROM_MENU = 'fromMenu';

export const REPORT_MISSING_LINK = 'https://form.jotform.com/252952688671472';

export const GENERAL_MENU_ITEMS: MenuItem[] = [
  {title: 'איך לבחור מסגרת חינוכית?', routerLink: ['/about', 'how-to-choose']},
  {title: 'קישורים שימושיים', routerLink: ['/about', 'useful-links']},
  {title: 'דווחו לנו על מסגרת חסרה', href: REPORT_MISSING_LINK},
];

export function cityPage(workspace: any): CityPage | null {
  const page: CityPage | undefined = workspace?.city_page;
  return page?.content?.trim() ? page : null;
}

export function cityPageTitle(workspace: any): string {
  return cityPage(workspace)?.title || `הגיל הרך ב${workspace?.city || ''}`;
}

export function cityMenuItems(workspace: any, workspaceId: string): MenuItem[] {
  const items: MenuItem[] = [];
  if (cityPage(workspace)) {
    items.push({
      title: cityPageTitle(workspace),
      routerLink: ['/about', 'city'],
      // So the page survives a reload or a shared link, where no workspace is loaded yet
      queryParams: {workspace: workspaceId},
    });
  }
  const links: any[] = workspace?.links || [];
  for (const link of links) {
    if (link?.kind === 'external' && link.href) {
      items.push({title: link.title || link.href, href: link.href});
    }
  }
  for (const link of links) {
    if (link?.kind === 'whatsapp' && link.href) {
      items.push({title: 'קהילה ועידכונים', href: link.href, whatsapp: true});
    }
  }
  return items;
}
