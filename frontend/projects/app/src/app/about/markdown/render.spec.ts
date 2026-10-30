import { headingCategory, renderMarkdown } from './render';

describe('renderMarkdown', () => {
  it('renders plain markdown untouched by default', () => {
    expect(renderMarkdown('## כותרת\n\nטקסט')).toContain('<h2 id=');
    expect(renderMarkdown('## כותרת\n\nטקסט')).not.toContain('<details');
  });

  it('turns ## sections into an accordion with the first one open, keeping the intro', () => {
    const html = renderMarkdown('# ראשי\n\nפתיח\n\n## אחת\n\nגוף א\n\n## שתיים\n\nגוף ב', {accordion: true});
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('h1')?.textContent).toEqual('ראשי');
    const details = Array.from(doc.querySelectorAll('details'));
    expect(details.map((d) => d.querySelector('summary')?.textContent)).toEqual(['אחת', 'שתיים']);
    expect(details.map((d) => d.open)).toEqual([true, false]);
    expect(details[1].querySelector('.details-body')?.textContent?.trim()).toEqual('גוף ב');
    // The intro stays outside the accordion
    expect(doc.body.firstElementChild?.tagName).toEqual('H1');
  });

  it('resolves reference links inside accordion sections', () => {
    const html = renderMarkdown('## אחת\n\n[קישור][x]\n\n[x]: https://example.org', {accordion: true});
    expect(html).toContain('href="https://example.org"');
  });

  it('opens links out in a new tab, and in-app links in place', () => {
    const html = renderMarkdown('[out](https://example.org) [in](/about/about)');
    expect(html).toContain('<a target="_blank" rel="noopener" href="https://example.org"');
    expect(html).toContain('<a href="/about/about"');
  });

  it('marks ### headings that name a category', () => {
    const html = renderMarkdown('### חינוך וטיפול בגיל הרך\n\n### צור קשר', {categoryIcons: true});
    expect(html).toContain('<h3 class="category section-education"');
    expect(html).toMatch(/<h3 id="[^"]*">צור קשר<\/h3>/);
  });

  it('matches the city pages\' category wording', () => {
    expect(headingCategory('חינוך וטיפול בגיל הרך')).toEqual('education');
    expect(headingCategory('בריאות והתפתחות הילד')).toEqual('health');
    expect(headingCategory('הורות, קהילה ופנאי')).toEqual('community');
    expect(headingCategory('ניתן ליצור איתנו קשר')).toBeNull();
  });
});
