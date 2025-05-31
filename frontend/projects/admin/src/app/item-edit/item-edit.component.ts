import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { Field, ItemEditSectionComponent } from "../item-edit-section/item-edit-section.component";
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-item-edit',
  imports: [ItemEditSectionComponent],
  templateUrl: './item-edit.component.html',
  styleUrl: './item-edit.component.less'
})
export class ItemEditComponent {
  FIELD_CONFIG_USER: Field[] = [
    {  name: 'name',        type: 'text',    label: 'שם'     },
    {  name: 'manager_name',   type: 'text',    label: 'שם מנהל.ת'  },
    {  name: 'education_stream', type: 'text', label: 'זרם חינוכי' },
    {  name: 'opening_hours', type: 'text', label: 'שעות פתיחה' },
    {  name: 'contact_details', type: 'text', label: 'פרטי קשר' },
    {  name: 'feeding',        type: 'text',    label: 'הזנה'     },
    {  name: 'safe_room',        type: 'boolean',    label: 'מרחב מוגן'     },
    {  name: 'additional_features', type: 'text', label: 'מאפיינים נוספים' },
    { name: 'classes_count', type: 'text', label: 'מספר כיתות' },
    { name: 'children_count', type: 'text', label: 'מספר ילדים' },
  ];  
  FIELD_CONFIG_ADMIN: Field[] = [
    {  name: 'app_publication', type: 'boolean', label: 'פרסום באפליקציה' },
    {  name: 'name',        type: 'text',    label: 'שם'     },
    {  name: 'address',     type: 'text',    label: 'כתובת'  },
    {  name: 'neighborhood',     type: 'text',    label: 'שכונה'  },
    {  name: 'manager_name',   type: 'text',    label: 'שם מנהל.ת'  },
    {  name: 'owner',        type: 'text',    label: 'ארגון מפעיל'     },
    {  name: 'kind',        type: 'enum',    label: 'סוג',  options: ['רשת ארצית', 'רשת עירונית', 'פרטי']   },
    {  name: 'education_stream', type: 'text', label: 'זרם חינוכי' },
    {  name: 'opening_hours', type: 'text', label: 'שעות פתיחה' },
    {  name: 'contact_details', type: 'text', label: 'פרטי קשר' },
    {  name: 'feeding',        type: 'text',    label: 'הזנה'     },
    {  name: 'safe_room',        type: 'boolean',    label: 'מרחב מוגן'     },
    {  name: 'additional_features', type: 'text', label: 'מאפיינים נוספים' },
    { name: 'classes_count', type: 'text', label: 'מספר כיתות' },
    { name: 'children_count', type: 'text', label: 'מספר ילדים' },

    { name: 'license_status_description', type: 'text', label: 'תיאור סטטוס רישוי' },

    { name: 'mentored', type: 'boolean', label: 'מודרכת' },
    { name: 'mentored_muni', type: 'boolean', label: 'מודרכת ע"י הרשות' },
    { name: 'mentoring_type', type: 'text', label: 'סוג הדרכה' },
    { name: 'mentoring_status_description', type: 'text', label: 'תיאור סטטוס הדרכה' },
    { name: 'mentor_name', type: 'text', label: 'שם מדריכה' },
    { name: 'mentor_phone', type: 'text', label: 'טלפון מדריכה' },    
  ];
  FIELD_CONFIG_OFFICIAL: Field[] = [
    {  name: 'name',        type: 'text',    label: 'שם'     },
    {  name: 'address',     type: 'text',    label: 'כתובת'  },
    {  name: 'license_status', type: 'text', label: 'סטטוס רישוי' },
    {  name: 'manager_name',   type: 'text',    label: 'שם מנהל.ת'  },
    {  name: 'owner',        type: 'text',    label: 'ארגון מפעיל'     },
    {  name: 'org_name',        type: 'text',    label: 'ארגון מפעיל'     },
    {  name: 'org',        type: 'text',    label: 'ארגון מפעיל'     },
    {  name: 'phone',       type: 'text',    label: 'טלפון'  },

    {  name: 'admission_committee',     type: 'boolean',    label: 'ועדת קבלה'   },
    {  name: 'facility_type',     type: 'text',    label: 'סוג מוסד'   },
    {  name: 'daycare_type', type: 'text',    label: 'סוג מעון'  },
    {  name: 'capacity',     type: 'text',    label: 'קיבולת'   },
    {  name: 'for_gender', type: 'text', label: 'מגדר' },
    {  name: 'from_age', type: 'text', label: 'מגיל' },
    {  name: 'to_age', type: 'text', label: 'עד גיל' },

    {  name: 'total_places', type: 'text', label: 'סה״כ מקומות' },
    {  name: 'available_places', type: 'text', label: 'מקומות פנויים' },
    {  name: 'total_places_babies', type: 'text', label: 'סה״כ מקומות לתינוקות' },
    {  name: 'available_places_babies', type: 'text', label: 'מקומות פנויים לתינוקות' },
    {  name: 'total_places_toddlers', type: 'text', label: 'סה״כ מקומות לפעוטות' },
    {  name: 'available_places_toddlers', type: 'text', label: 'מקומות פנויים לפעוטות' },
    {  name: 'total_places_adults', type: 'text', label: 'סה״כ מקומות למבוגרים' },
    {  name: 'available_places_adults', type: 'text', label: 'מקומות פנויים למבוגרים' },

    {  name: 'religion',     type: 'text',    label: 'דת'    },
    {  name: 'sector',     type: 'text',    label: 'מגזר'    },
    {  name: 'city',        type: 'text',    label: 'עיר'     },
    {  name: 'coord_x',     type: 'text',    label: 'קואורדינטה X'   },
    {  name: 'coord_y',     type: 'text',    label: 'קואורדינטה Y'   },


    {  name: 'mol_symbol' , hide: true },
    {  name: 'symbol',      hide: true },
    {  name: 'office',      hide: true },
    {  name: 'symbol_text', hide: true },
    {  name: 'source',      hide: true },
  ];

  update: any = {};
  updater = new Subject<void>();

  constructor(public api: ApiService, private route: ActivatedRoute) {
    this.api.updateFromRoute(this.route.snapshot);
    this.updater.pipe(
      debounceTime(2000)
    ).subscribe(() => {
      const update = this.update;
      this.update = {};
      this.api.updateItem(update);
    });
  }

  queueUpdate(update: any) {
    this.update = {...this.update, ...update};
    this.updater.next();
  }

}
