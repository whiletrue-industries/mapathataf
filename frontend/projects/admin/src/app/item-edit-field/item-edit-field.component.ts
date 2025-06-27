import { Component, computed, effect, ElementRef, EventEmitter, input, Output, signal, ViewChild } from '@angular/core';
import { Field, fieldValue } from '../item-edit-section/item-edit-section.component';
import { FormsModule } from '@angular/forms';
import { timer } from 'rxjs';
import { ImageUploadComponent } from "../image-upload/image-upload.component";

@Component({
  selector: 'app-item-edit-field',
  imports: [
    FormsModule,
    ImageUploadComponent
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
        this.value.set(data[field.name]);
      } else {
        this.value.set(null);
      }
    });
  }

  save(): void {
    const field = this.field();
    const data = this.data();
    if (this.editable() && field && data) {
      data[field.name] = this.value();
      console.log('ItemEditFieldComponent: save', field.name, this.value());
      this.update.emit({ [field.name]: this.value() });
      field.value = fieldValue(data, field);
      this.editing.set(false);
    }
  }
}
