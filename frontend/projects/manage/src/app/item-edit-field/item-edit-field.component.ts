import { Component, computed, effect, ElementRef, EventEmitter, input, Output, signal, ViewChild } from '@angular/core';
import { Field, fieldValue } from '../fields';
import { FormsModule } from '@angular/forms';
import { timer } from 'rxjs';

function sameValue(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}

@Component({
  selector: 'app-item-edit-field',
  imports: [
    FormsModule
],
  templateUrl: './item-edit-field.component.html',
  styleUrl: './item-edit-field.component.less'
})
export class ItemEditFieldComponent {
  data = input<any>(null);
  field = input<Field>();
  editable = input(false);
  @Output() update = new EventEmitter<any>();

  value = signal<any>(null);
  editing = signal(false);

  privateField = computed(() => {
    const field = this.field();
    return field && (field.name.startsWith('_private_') || field.internal);
  });

  @ViewChild('textInput', { static: false }) textInput: ElementRef;

  constructor() {
    effect(() => {
      if (this.editing()) {
        timer(0).subscribe(() => {
          if (this.textInput && this.textInput.nativeElement) {
            this.textInput.nativeElement.focus();
          }
        });
      }
    });
    effect(() => {
      const data = this.data();
      const field = this.field();
      if (data && field) {
        if (field.type === 'multi-enum') {
          const value = data[field.name];
          this.value.set(Array.isArray(value) ? [...value] : (value ? [value] : []));
        } else {
          this.value.set(data[field.name]);
        }
      } else {
        this.value.set(null);
      }
    });
  }

  save(keepEditing = false): void {
    const field = this.field();
    const data = this.data();
    if (this.editable() && field && data) {
      if (!sameValue(data[field.name], this.value())) {
        data[field.name] = this.value();
        console.log('ItemEditFieldComponent: save', field.name, this.value());
        this.update.emit({ [field.name]: this.value() });
        field.value = fieldValue(data, field);
      }
      this.editing.set(!!keepEditing);
    }
  }

  optionSelected(id: string): boolean {
    const value = this.value();
    return Array.isArray(value) && value.includes(id);
  }

  toggleOption(id: string): void {
    const field = this.field();
    const current: string[] = Array.isArray(this.value()) ? [...this.value()] : [];
    const index = current.indexOf(id);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    const ordered = (field?.options || []).map((opt) => opt.id).filter((optId) => current.includes(optId));
    this.value.set(ordered);
    this.save(true);
  }
}
