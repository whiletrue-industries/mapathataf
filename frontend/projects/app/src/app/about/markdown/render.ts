import { marked } from 'marked';
import { ConcreteSection } from '../../sections';

export type RenderOptions = {
  // Each `##` section becomes a collapsible <details>, the first one open
  accordion?: boolean;
  // A `###` heading naming one of the map's categories gets that category's icon
  categoryIcons?: boolean;
};

// Matched against a heading's text, in order. Loose on purpose: city pages word their
// categories their own way ("חינוך וטיפול בגיל הרך", "הורות, קהילה ופנאי").
const CATEGORY_KEYWORDS: [ConcreteSection, RegExp][] = [
  ['education', /חינוך/],
  ['health', /בריאות|התפתחות/],
  ['community', /קהילה|פנאי|אחה["״]צ/],
];

export function headingCategory(text: string): ConcreteSection | null {
  return CATEGORY_KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? null;
}

export function renderMarkdown(markdown: string, options: RenderOptions = {}): string {
  let html = options.accordion ? renderAccordion(markdown) : marked.parse(markdown);
  if (options.categoryIcons) {
    html = html.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/g, (heading, attrs, inner) => {
      const category = headingCategory(inner.replace(/<[^>]*>/g, ''));
      return category ? `<h3 class="category section-${category}"${attrs}>${inner}</h3>` : heading;
    });
  }
  return html;
}

function renderAccordion(markdown: string): string {
  const tokens = marked.lexer(markdown);
  // Reference-style links are resolved against the whole document's definitions
  const parse = (part: marked.Token[]) => marked.parser(Object.assign(part, {links: tokens.links}));
  const intro: marked.Token[] = [];
  const sections: {title: string, body: marked.Token[]}[] = [];
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      sections.push({title: token.text, body: []});
    } else {
      (sections.length ? sections[sections.length - 1].body : intro).push(token);
    }
  }
  return parse(intro) + sections.map((section, i) =>
    `<details${i === 0 ? ' open' : ''}><summary>${marked.parseInline(section.title)}</summary>` +
    `<div class="details-body">${parse(section.body)}</div></details>`
  ).join('');
}
