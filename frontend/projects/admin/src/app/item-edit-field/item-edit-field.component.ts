import { Component, effect, ElementRef, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { Field, fieldValue } from '../item-edit-section/item-edit-section.component';
import { FormsModule } from '@angular/forms';
import { timer } from 'rxjs';

@Component({
  selector: 'app-item-edit-field',
  imports: [
    FormsModule
  ],
  templateUrl: './item-edit-field.component.html',
  styleUrl: './item-edit-field.component.less'
})
export class ItemEditFieldComponent implements OnChanges{
  @Input() data: any;
  @Input() field: Field;
  @Input() editable: boolean = false;
  @Output() update = new EventEmitter<any>();

  value = signal<any>(null);
  editing = signal(false);

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
  }

  ngOnChanges(): void {
    if (this.data && this.field) {
      this.value.set(this.data[this.field.name]);
    } else {
      this.value.set(null);
    }
  }

  save(): void {
    if (this.editable && this.field && this.data) {
      this.data[this.field.name] = this.value();
      console.log('ItemEditFieldComponent: save', this.field.name, this.value());
      this.update.emit({ [this.field.name]: this.value() });
      this.field.value = fieldValue(this.data, this.field);
      this.editing.set(false);
    }
  }
}
