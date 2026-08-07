import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LinksEditorComponent } from './links-editor.component';
import { WorkspaceLink } from '../api.service';

describe('LinksEditorComponent', () => {
  let fixture: ComponentFixture<LinksEditorComponent>;
  let component: LinksEditorComponent;
  let updates: WorkspaceLink[][];

  function setup(links: WorkspaceLink[] | undefined) {
    fixture = TestBed.createComponent(LinksEditorComponent);
    component = fixture.componentInstance;
    updates = [];
    component.update.subscribe((value: WorkspaceLink[]) => updates.push(value));
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();
  }

  it('copies incoming links into editable rows', () => {
    const links: WorkspaceLink[] = [{kind: 'whatsapp', href: 'https://chat.whatsapp.com/x', title: 'קהילה'}];
    setup(links);
    expect(component.rows()).toEqual(links);
    expect(component.rows()[0]).not.toBe(links[0]);
    expect(component.dirty()).toBeFalse();
  });

  it('adds and removes rows and emits the complete array on save', () => {
    setup([{kind: 'internal', href: 'munis/rehovot', title: 'הגיל הרך'}]);
    component.addRow();
    expect(component.dirty()).toBeTrue();
    component.rows()[1].href = 'https://example.com';
    component.rows()[1].title = 'אתר';
    component.save();
    expect(updates).toEqual([[
      {kind: 'internal', href: 'munis/rehovot', title: 'הגיל הרך'},
      {kind: 'external', href: 'https://example.com', title: 'אתר'},
    ]]);
    expect(component.dirty()).toBeFalse();
  });

  it('drops empty rows on save', () => {
    setup([]);
    component.addRow();
    component.save();
    expect(updates).toEqual([[]]);
  });

  it('removes a row', () => {
    setup([
      {kind: 'internal', href: 'a', title: 'a'},
      {kind: 'external', href: 'b', title: 'b'},
    ]);
    component.removeRow(0);
    component.save();
    expect(updates).toEqual([[{kind: 'external', href: 'b', title: 'b'}]]);
  });
});
