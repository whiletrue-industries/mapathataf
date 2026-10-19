import { marked } from 'marked';
import TurndownService from 'turndown';

// The city page is stored as markdown (the map app renders it with marked); the editor
// works in HTML. These two convert between them.

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown || '', {headerIds: false, mangle: false});
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '*',
  emDelimiter: '_',
});

// Turndown's own rule pads markers to four columns and leaves whitespace-only lines inside
// items; this writes `* item` / `1. item`, with continuation lines indented under the text.
turndown.addRule('listItem', {
  filter: 'li',
  replacement(content, node, options) {
    const parent = node.parentNode as HTMLElement;
    let prefix = `${options.bulletListMarker} `;
    if (parent.nodeName === 'OL') {
      const start = Number(parent.getAttribute('start') || 1);
      prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
    }
    const body = content
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .replace(/\n/g, '\n' + ' '.repeat(prefix.length))
      .replace(/^ +$/gm, '');
    return prefix + body + (node.nextSibling ? '\n' : '');
  },
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html || '').trim();
}
