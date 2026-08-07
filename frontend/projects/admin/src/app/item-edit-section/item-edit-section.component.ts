import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { ItemEditFieldComponent } from "../item-edit-field/item-edit-field.component";
import { Field, fieldValue } from '../fields';

export { fieldValue } from '../fields';
export type { Field, Option } from '../fields';


@Component({
  selector: 'app-item-edit-section',
  imports: [
    ItemEditFieldComponent
  ],
  templateUrl: './item-edit-section.component.html',
  styleUrl: './item-edit-section.component.less'
})
export class ItemEditSectionComponent implements OnChanges{
  @Input() data: any;
  @Input() header: string;
  @Input() fieldConfig: any;
  @Input() inner = false;
  @Input() editable = false;
  @Input() showAll = false;

  @Output() update = new EventEmitter<any>();

  fields = signal<Field[]>([]);

  ngOnChanges() {
      // console.log('ItemEditSectionComponent: ngOnChanges - showAll', this.header, this.fieldConfig?.length, this.showAll, this.data, this.fieldConfig);
    if (this.data && this.fieldConfig?.length >= 0) {
      const fields: Field[] = [];
      if (this.showAll) {
        this.fieldConfig.forEach((field: any) => {
          if (!field.hide) {
            fields.push({
              name: field.name,
              type: field.type,
              label: field.label,
              value: fieldValue(this.data, field),
              options: field.options,
              internal: field.internal || false 
            });
          }
        });
      } else {
        this.fieldConfig.forEach((field: any) => {
          if (!field.hide && this.data[field.name] !== undefined && this.data[field.name] !== null) {
            fields.push({
              name: field.name,
              type: field.type,
              label: field.label,
              value: fieldValue(this.data, field),
              options: field.options
            });
          }
        });
        Object.keys(this.data).forEach((key) => {
          const field = this.fieldConfig.find((f: any) => f.name === key);
          if (!field) {
            fields.push({
              name: key,
              type: 'text',
              label: key,
              value: this.data[key]
            });
          }
        });
      }
      this.fields.set(fields);
    }
  }
}
