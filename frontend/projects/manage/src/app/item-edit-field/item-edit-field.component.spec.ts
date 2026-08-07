import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemEditFieldComponent } from './item-edit-field.component';
import { Field } from '../fields';

describe('ItemEditFieldComponent', () => {
  const OPTIONS = [
    { id: 'birth_to_1', display: 'לידה עד 1' },
    { id: '1_to_2', display: '1-2' },
    { id: '2_to_3', display: '2-3' },
    { id: '3_to_6', display: '3-6' },
  ];

  let fixture: ComponentFixture<ItemEditFieldComponent>;
  let component: ItemEditFieldComponent;
  let updates: any[];

  function setup(data: any, field: Field) {
    fixture = TestBed.createComponent(ItemEditFieldComponent);
    component = fixture.componentInstance;
    updates = [];
    component.update.subscribe((update: any) => updates.push(update));
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();
  }

  describe('save', () => {
    it('does not emit an update when the value did not change', () => {
      setup({ name: 'גן חלומותיי' }, { name: 'name', type: 'text' });
      component.editing.set(true);
      component.save();
      expect(updates).toEqual([]);
      expect(component.editing()).toBeFalse();
    });

    it('emits an update when the value changed', () => {
      const data = { name: 'גן חלומותיי' };
      setup(data, { name: 'name', type: 'text' });
      component.value.set('גן אחר');
      component.save();
      expect(updates).toEqual([{ name: 'גן אחר' }]);
      expect(data.name).toBe('גן אחר');
    });

    it('does not emit for an equal-content array in a multi-enum field', () => {
      setup({ age_group: ['1_to_2', '2_to_3'] }, { name: 'age_group', type: 'multi-enum', options: OPTIONS });
      component.save();
      expect(updates).toEqual([]);
    });

    it('edits and saves a textarea field', () => {
      const data = { intro: 'טקסט ישן' };
      setup(data, { name: 'intro', type: 'textarea' });
      component.editing.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
      component.value.set('טקסט חדש');
      component.save();
      expect(updates).toEqual([{ intro: 'טקסט חדש' }]);
      expect(data.intro).toBe('טקסט חדש');
    });
  });

  describe('multi-enum', () => {
    it('normalizes a legacy scalar value into an array', () => {
      setup({ age_group: '1_to_2' }, { name: 'age_group', type: 'multi-enum', options: OPTIONS });
      expect(component.value()).toEqual(['1_to_2']);
    });

    it('copies the stored array instead of aliasing it', () => {
      const stored = ['1_to_2'];
      setup({ age_group: stored }, { name: 'age_group', type: 'multi-enum', options: OPTIONS });
      expect(component.value()).toEqual(stored);
      expect(component.value()).not.toBe(stored);
    });

    it('toggles options on and off, keeping option order, and saves each change', () => {
      const data: any = { age_group: ['2_to_3'] };
      setup(data, { name: 'age_group', type: 'multi-enum', options: OPTIONS });
      component.editing.set(true);

      component.toggleOption('birth_to_1');
      expect(component.value()).toEqual(['birth_to_1', '2_to_3']);
      expect(component.editing()).toBeTrue();

      component.toggleOption('2_to_3');
      expect(component.value()).toEqual(['birth_to_1']);

      expect(updates).toEqual([{ age_group: ['birth_to_1', '2_to_3'] }, { age_group: ['birth_to_1'] }]);
      expect(data.age_group).toEqual(['birth_to_1']);
    });

    it('reports selected options', () => {
      setup({ age_group: ['1_to_2'] }, { name: 'age_group', type: 'multi-enum', options: OPTIONS });
      expect(component.optionSelected('1_to_2')).toBeTrue();
      expect(component.optionSelected('3_to_6')).toBeFalse();
    });
  });
});
