import { Component, computed, effect, Input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Field, ItemEditSectionComponent, Option } from "../item-edit-section/item-edit-section.component";
import { debounceTime, Subject, timer } from 'rxjs';
import dayjs from 'dayjs';
import { ItemEditFieldComponent } from "../item-edit-field/item-edit-field.component";

@Component({
  selector: 'app-item-edit',
  imports: [
    ItemEditSectionComponent,
    RouterLink,
],
  templateUrl: './item-edit.component.html',
  styleUrl: './item-edit.component.less'
})
export class ItemEditComponent {

  AGE_GROUP_OPTIONS: Option[] = [
    { 'id': 'birth_to_1', 'display': 'לידה עד 1' },
    { 'id': '1_to_2', 'display': '1-2' },
    { 'id': '2_to_3', 'display': '2-3' },
    { 'id': 'all_ages', 'display': 'כל הגילאים' }
  ];
  FACILITY_KIND_OPTIONS: Option[] = [
    { 'id': 'education', 'display': 'מסגרת חינוך' },
    { 'id': 'health', 'display': 'בריאות והתפתחות' },
    { 'id': 'community', 'display': 'פנאי וקהילה' }
  ];
  SAFE_ROOM_OPTIONS: Option[] = [
    { 'id': 'safe_room', 'display': 'ממ"ד' },
    { 'id': 'standard_shelter', 'display': 'מקלט תקני' },
    { 'id': 'no_shelter', 'display': 'ללא מרחב מוגן' },
    { 'id': 'unknown', 'display': 'לא ידוע' }
  ];
  FACILITY_KIND_FIELD: Field = {
    name: 'facility_kind',
    type: 'enum',
    label: 'סוג מענה',
    options: this.FACILITY_KIND_OPTIONS
  };
  FACILITY_SUB_KIND_FIELD: { [key: string]: Field[] } = {
    'education': [],
    'health': [
      { name: 'facility_sub_kind', type: 'enum', label: 'תת סוג מענה', options: [
        { 'id': 'טיפת חלב', 'display': 'טיפת חלב' },
        { 'id': 'מרכז לגיל רך', 'display': 'מרכז לגיל רך' },
        { 'id': 'הדרכה וייעוץ', 'display': 'הדרכה וייעוץ' },
        { 'id': 'אחר', 'display': 'אחר' }
      ]}],
    'community': [
      { name: 'facility_sub_kind', type: 'enum', label: 'תת סוג מענה', options: [
        { 'id': 'גן עם אמא', 'display': 'גן עם אמא' },
        { 'id': 'חוגים', 'display': 'חוגים' },
        { 'id': 'גן או פארק', 'display': 'גן או פארק' },
        { 'id': 'אחר', 'display': 'אחר' },
      ]}]
  };

  itemKind = computed(() => {
    const item = this.api.item();
    console.log('ItemEditComponent: itemKind', item?.resolved?.facility_kind);
    return item?.resolved?.facility_kind || 'not-set';
  });
  
  FIELD_CONFIG_USER = computed<Field[]>(() => {
    const educationUserFields = this.FIELD_CONFIG_USER_EDUCATION();
    const itemKind = this.itemKind();
    return [
      {  name: 'תיאור המענה', type: 'section' },
        {  name: 'name',        type: 'text',    label: 'שם'     },
        {  name: 'age_group',     type: 'enum',    label: 'קבוצת גיל', options: this.AGE_GROUP_OPTIONS },
        {  name: 'activity_hours', type: 'text', label: 'שעות פעילות' },
        {  name: 'more_details', type: 'text', label: 'פרטים נוספים' },
        {  name: 'owner',        type: 'text',    label: 'ארגון מפעיל', internal: true     },
        {  name: '_private_safe_room',        type: 'enum',    label: 'מרחב מוגן', options: this.SAFE_ROOM_OPTIONS },

      ...(itemKind === 'education' ? educationUserFields : []),

      {  name: 'פרטי קשר', type: 'section' },
        {  name: 'manager_name',   type: 'text',    label: 'שם מנהל.ת' },
        {  name: 'url',   type: 'text',    label: 'כתובת אתר'  },
        {  name: 'phone', type: 'text', label: 'טלפון' },
        {  name: 'email', type: 'text', label: 'דוא"ל' },

      {  name: 'תמונת המסגרת', type: 'section' },
        {  name: 'photo',   type: 'image',    label: 'תמונה מייצגת של המסגרת' },
        
    ];
  });
  FIELD_CONFIG_USER_EDUCATION = computed<Field[]>(() => [

    {  name: 'מידע נוסף על מסגרות חינוך', type: 'section' },
      { name: 'education_stream', type: 'text', label: 'זרם חינוכי', internal: true },
      { name: 'classes_count', type: 'text', label: 'מספר כיתות', internal: true },
      { name: 'children_count', type: 'text', label: 'מספר ילדים', internal: true },
      {  name: '_private_feeding',        type: 'enum',    label: 'הזנה', options: [
          { 'id': 'catering', 'display': 'קייטרינג' },
          { 'id': 'kitchen', 'display': 'מבשלת' },
          { 'id': 'no_feeding', 'display': 'ללא הזנה' }
        ] },
  ]);


  FIELD_CONFIG_ADMIN = computed<Field[]>(() => {
    const educationAdminFields = this.FIELD_CONFIG_ADMIN_EDUCATION();
    const itemKind = this.itemKind();
    const item = this.api.item();
    return [
      {  name: 'app_publication', type: 'boolean', label: 'פרסום באפליקציה', internal: true },
      ...(item.resolved?.facility_kind_editable ? [this.FACILITY_KIND_FIELD] : []),
      ...(this.FACILITY_SUB_KIND_FIELD[itemKind] || []),

      {  name: 'תיאור המענה', type: 'section' },
        {  name: 'name',        type: 'text',    label: 'שם'    },
        {  name: 'age_group',     type: 'enum',    label: 'קבוצת גיל', options: this.AGE_GROUP_OPTIONS },
        {  name: 'owner',        type: 'text',    label: 'ארגון מפעיל ', internal: true },

        ...(itemKind === 'education' ? [
          { name: 'owner_kind',    type: 'enum',   label: 'סוג ארגון מפעיל', options: [
            { 'id': 'national', 'display': 'רשת ארצית' },
            { 'id': 'municipal', 'display': 'רשת עירונית' },
            { 'id': 'private', 'display': 'פרטי' }
          ], internal: true },
        ] as Field[] : []),

        {  name: '_private_safe_room',        type: 'enum',    label: 'מרחב מוגן', options: this.SAFE_ROOM_OPTIONS },
        {  name: '_private_notes', type: 'text', label: 'הערות נוספות' },

      {  name: 'מיקום', type: 'section' },
        {  name: 'address',     type: 'text',    label: 'כתובת'  },
        {  name: 'neighborhood',     type: 'enum',    label: 'שכונה', options: this.api.neighborhoodOptions(), internal: true },

      ...(itemKind === 'education' ? educationAdminFields : []),

      {  name: 'פרטי קשר', type: 'section' },
        {  name: 'manager_name',   type: 'text',    label: 'שם מנהל.ת' },
        {  name: 'url',   type: 'text',    label: 'כתובת אתר אינטרנט'  },
        {  name: 'phone', type: 'text', label: 'טלפון' },
        {  name: 'email', type: 'text', label: 'דוא"ל' },
        {  name: '_private_contact_details', type: 'text', label: 'פרטי קשר נוספים' },

    ];
  });
  FIELD_CONFIG_ADMIN_EDUCATION = computed<Field[]>(() => [

    {  name: 'רישוי', type: 'section' },
      {  name: 'licensing_not_needed',     type: 'boolean',    label: 'מתחת ל-7 ילדים ואינו דורש רישוי' },
      {  name: '_private_licensing_process_notes',     type: 'text',    label: 'סטטוס ליווי הרשות בתהליך הרישוי' },

    {  name: 'הדרכה', type: 'section' },
      { name: 'mentoring_type', type: 'enum', label: 'סוג הדרכה', options: [
        { 'id': 'municipal', 'display': 'הדרכה עירונית'},
        { 'id': 'private', 'display': 'הדרכה פרטית'},
        { 'id': 'not_mentored', 'display': 'אינו מודרך/לא ידוע' }
      ] },
      { name: '_private_mentoring_status_description', type: 'text', label: 'סטטוס ליווי הרשות בהדרכה' },
      { name: '_private_mentor_name', type: 'text', label: 'שם מדריכה' },
      { name: '_private_mentor_phone', type: 'text', label: 'טלפון מדריכה' },    
  ]);
  FIELD_CONFIG_OFFICIAL = computed<Field[]>(() => [
    {  name: 'name',        type: 'text',    label: 'שם'     },
    {  name: 'address',     type: 'text',    label: 'כתובת'  },
    {  name: 'school_year',     type: 'text',    label: 'שנת לימודים'  },
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
  ]);

  update: any = {};
  updater = new Subject<void>();
  
  copiedLink = signal(false);
  clipboardSupported = signal(false);

  dayjs = dayjs;

  constructor(public api: ApiService, private route: ActivatedRoute, private router: Router) {
    this.api.updateFromRoute(this.route.snapshot);
    dayjs.locale('he');
    this.updater.pipe(
      debounceTime(750)
    ).subscribe(() => {
      const update = this.update;
      this.update = {};
      this.api.updateItem(update);
    });
    effect(() => {
      const item = this.api.item();
      if (item) {
        this.copiedLink.set(false);
      }
    });
    try {
      this.clipboardSupported.set(document.queryCommandSupported && document.queryCommandSupported('copy'));
    } catch (e) {
      console.log('Failed to check if copy clipboard is available');
    }
  }

  niceDate(date: string | Date) {
    return dayjs(date).format('D בMMMM, YYYY');
  }

  queueUpdate(update: any) {
    this.update = {...this.update, ...update};
    this.updater.next();
  }

  copyToClipboard() {
    console.log('Copying to clipboard');
    if (!this.clipboardSupported()) {
      console.warn('Clipboard copy not supported');
      return;
    }
    const text = `${window.location.origin}${window.location.pathname}?item-key=${this.api.item().key}`;
    const txt = document.createElement('textarea');
    txt.textContent = text;
    txt.classList.add('visually-hidden');
    document.body.appendChild(txt);
    txt.select();
    try {
      document.execCommand('copy');
      this.copiedLink.set(true);
    } catch (ex) {
      console.error('Failed to copy to clipboard', ex);
    } finally {
      document.body.removeChild(txt);
    }
  }

  setDeleted(deleted: boolean) {
    this.queueUpdate({_private_deleted: deleted});
    if (deleted) {
      timer(1000).subscribe(() => {
        this.router.navigate(['/', this.api.workspaceId()], { queryParamsHandling: 'preserve'});
      });
    }
  }
}
