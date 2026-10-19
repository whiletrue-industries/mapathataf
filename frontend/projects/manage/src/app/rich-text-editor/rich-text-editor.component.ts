import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import type { Editor } from '@tiptap/core';
import { htmlToMarkdown, markdownToHtml } from './markdown';

type Command = {label: string, title: string, active?: () => boolean, run: (editor: Editor) => void};

// A right-to-left WYSIWYG editor over a markdown value. Tiptap is imported lazily, so it
// stays out of the main bundle and never runs on the server.
@Component({
  selector: 'app-rich-text-editor',
  imports: [],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.less'
})
export class RichTextEditorComponent {
  markdown = input<string>('');
  markdownChange = output<string>();

  private host = viewChild.required<ElementRef<HTMLElement>>('host');
  private editor: Editor | null = null;
  // What we last emitted, so the value coming back in through `markdown` isn't re-loaded
  // (that would reset the cursor on every keystroke)
  private current = '';
  // Bumped on every transaction, so the toolbar's active states re-render
  tick = signal(0);

  commands: Command[] = [
    {label: 'כותרת', title: 'כותרת (##)', active: () => this.is('heading', {level: 2}),
      run: (e) => e.chain().focus().toggleHeading({level: 2}).run()},
    {label: 'כותרת משנה', title: 'כותרת משנה (###) - מקבלת אייקון כשהיא מזכירה קטגוריה', active: () => this.is('heading', {level: 3}),
      run: (e) => e.chain().focus().toggleHeading({level: 3}).run()},
    {label: 'B', title: 'מודגש', active: () => this.is('bold'), run: (e) => e.chain().focus().toggleBold().run()},
    {label: 'I', title: 'נטוי', active: () => this.is('italic'), run: (e) => e.chain().focus().toggleItalic().run()},
    {label: '• רשימה', title: 'רשימה', active: () => this.is('bulletList'), run: (e) => e.chain().focus().toggleBulletList().run()},
    {label: '1. רשימה', title: 'רשימה ממוספרת', active: () => this.is('orderedList'), run: (e) => e.chain().focus().toggleOrderedList().run()},
    {label: 'קישור', title: 'הוספת קישור או עריכתו', active: () => this.is('link'), run: (e) => this.editLink(e)},
    {label: '↶', title: 'ביטול', run: (e) => e.chain().focus().undo().run()},
    {label: '↷', title: 'חזרה', run: (e) => e.chain().focus().redo().run()},
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      const [{Editor}, {StarterKit}] = await Promise.all([import('@tiptap/core'), import('@tiptap/starter-kit')]);
      this.current = this.markdown();
      this.editor = new Editor({
        element: this.host().nativeElement,
        extensions: [StarterKit.configure({
          heading: {levels: [2, 3]},
          code: false,
          codeBlock: false,
          horizontalRule: false,
          link: {openOnClick: false, autolink: true},
        })],
        content: markdownToHtml(this.current),
        editorProps: {attributes: {dir: 'rtl', class: 'content'}},
        onTransaction: () => this.tick.update((t) => t + 1),
        onUpdate: ({editor}) => {
          this.current = htmlToMarkdown(editor.getHTML());
          this.markdownChange.emit(this.current);
        },
      });
      destroyRef.onDestroy(() => this.editor?.destroy());
    });
    effect(() => {
      const markdown = this.markdown();
      if (this.editor && markdown !== this.current) {
        this.current = markdown;
        this.editor.commands.setContent(markdownToHtml(markdown), {emitUpdate: false});
      }
    });
  }

  is(name: string, attrs?: {[key: string]: any}): boolean {
    this.tick();
    return !!this.editor?.isActive(name, attrs);
  }

  run(command: Command) {
    if (this.editor) {
      command.run(this.editor);
    }
  }

  private editLink(editor: Editor) {
    const previous = editor.getAttributes('link')['href'] || '';
    const href = window.prompt('כתובת הקישור (ריק להסרה)', previous);
    if (href === null) {
      return;
    }
    const chain = editor.chain().focus().extendMarkRange('link');
    (href.trim() ? chain.setLink({href: href.trim()}) : chain.unsetLink()).run();
  }
}
