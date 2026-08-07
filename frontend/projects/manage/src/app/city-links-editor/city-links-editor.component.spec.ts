import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityLinksEditorComponent } from './city-links-editor.component';
import { Workspace } from '../api.service';

function workspace(id: string, city: string): Workspace {
  return {id, favorite: false, active: false, metadata: {city}};
}

describe('CityLinksEditorComponent', () => {
  let fixture: ComponentFixture<CityLinksEditorComponent>;
  let component: CityLinksEditorComponent;
  let updates: string[][];

  const WORKSPACES = [
    workspace('sorek-dromi', 'שורק דרומי'),
    workspace('gn-rooh', 'גן רווה'),
    workspace('gdrot', 'גדרות'),
    workspace('gdrh', 'גדרה'),
  ];

  function setup(cityLinks: string[] | undefined) {
    fixture = TestBed.createComponent(CityLinksEditorComponent);
    component = fixture.componentInstance;
    updates = [];
    component.update.subscribe((value: string[]) => updates.push(value));
    fixture.componentRef.setInput('cityLinks', cityLinks);
    fixture.componentRef.setInput('workspaces', WORKSPACES);
    fixture.componentRef.setInput('selfId', 'sorek-dromi');
    fixture.detectChanges();
  }

  it('shows the linked cities with their names', () => {
    setup(['gdrot', 'mystery']);
    expect(component.selected()).toEqual(['gdrot', 'mystery']);
    expect(component.cityName()('gdrot')).toEqual('גדרות');
    expect(component.cityName()('mystery')).toEqual('mystery');
  });

  it('suggests only matching, unlinked, other workspaces', () => {
    setup(['gdrot']);
    component.query.set('גדר');
    expect(component.suggestions().map((w) => w.id)).toEqual(['gdrh']);
    component.query.set('gn');
    expect(component.suggestions().map((w) => w.id)).toEqual(['gn-rooh']);
    component.query.set('שורק');
    expect(component.suggestions()).toEqual([]);
    component.query.set('');
    expect(component.suggestions()).toEqual([]);
  });

  it('adds a suggestion, clears the query and emits the full list on save', () => {
    setup(['gdrot']);
    component.query.set('גן');
    component.add('gn-rooh');
    expect(component.query()).toEqual('');
    expect(component.dirty()).toBeTrue();
    component.save();
    expect(updates).toEqual([['gdrot', 'gn-rooh']]);
  });

  it('removes an item and can save an empty list', () => {
    setup(['gdrot']);
    component.remove('gdrot');
    component.save();
    expect(updates).toEqual([[]]);
  });
});
