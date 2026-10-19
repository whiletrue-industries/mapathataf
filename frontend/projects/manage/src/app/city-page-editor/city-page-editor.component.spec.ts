import { TestBed } from '@angular/core/testing';
import { CityPage, CityPageEditorComponent } from './city-page-editor.component';

describe('CityPageEditorComponent', () => {
  function create(page?: CityPage) {
    const fixture = TestBed.createComponent(CityPageEditorComponent);
    fixture.componentRef.setInput('page', page);
    fixture.detectChanges();
    const emitted: (CityPage | null)[] = [];
    fixture.componentInstance.update.subscribe((value) => emitted.push(value));
    return {component: fixture.componentInstance, emitted};
  }

  it('loads the stored page', () => {
    const {component} = create({title: 'כותרת', content: 'תוכן'});
    expect(component.title()).toEqual('כותרת');
    expect(component.subtitle()).toEqual('');
    expect(component.content()).toEqual('תוכן');
  });

  it('saves only the filled-in fields, trimmed', () => {
    const {component, emitted} = create();
    component.subtitle.set('  משקיעים מלידה ');
    component.content.set('## שלום\n');
    component.save();
    expect(emitted).toEqual([{subtitle: 'משקיעים מלידה', content: '## שלום'}]);
  });

  it('saves null when everything is cleared, which deletes the key', () => {
    const {component, emitted} = create({content: 'תוכן'});
    component.content.set('   ');
    component.save();
    expect(emitted).toEqual([null]);
  });
});
