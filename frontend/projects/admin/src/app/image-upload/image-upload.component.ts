import { AfterViewInit, Component, computed, ElementRef, EventEmitter, Input, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { MAX_PHOTOS } from '../../../../app/src/app/photos';
import { encodePhoto } from './encode-photo';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.less'
})
export class ImageUploadComponent implements OnInit, AfterViewInit {
  @Input() value: WritableSignal<string[] | null>;
  @Output() update = new EventEmitter<void>();

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;

  MAX_PHOTOS = MAX_PHOTOS;

  // A draft: nothing reaches `value` until the user saves.
  photos = signal<string[]>([]);
  busy = signal(false);
  message = signal<string | null>(null);
  full = computed(() => this.photos().length >= MAX_PHOTOS);

  ngOnInit(): void {
    this.photos.set([...(this.value() || [])]);
  }

  ngAfterViewInit(): void {
    // With nothing to show yet, go straight to the file picker.
    if (this.photos().length === 0) {
      this.clicker();
    }
  }

  clicker() {
    this.fileInput?.nativeElement?.click();
  }

  async processImages(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    // Lets the same file be picked again after it was removed.
    input.value = '';
    if (!files.length) return;

    const room = MAX_PHOTOS - this.photos().length;
    let failed = 0;
    this.message.set(null);
    this.busy.set(true);
    try {
      for (const file of files.slice(0, room)) {
        try {
          const dataUrl = await encodePhoto(file);
          this.photos.update((photos) => [...photos, dataUrl]);
        } catch (err) {
          console.error('ImageUploadComponent: failed to process', file.name, err);
          failed++;
        }
      }
    } finally {
      this.busy.set(false);
    }
    const messages: string[] = [];
    if (failed) {
      messages.push(failed === 1 ? 'לא ניתן היה לקרוא את אחד הקבצים' : `לא ניתן היה לקרוא ${failed} מהקבצים`);
    }
    if (files.length > room) {
      messages.push(`ניתן להעלות עד ${MAX_PHOTOS} תמונות - חלק מהקבצים לא נוספו`);
    }
    this.message.set(messages.join('. ') || null);
  }

  pickerCancelled(): void {
    // Backing out of the picker that opened by itself backs out of the edit too.
    if (this.photos().length === 0 && !(this.value() || []).length) {
      this.cancel();
    }
  }

  remove(index: number): void {
    this.photos.update((photos) => photos.filter((_, i) => i !== index));
    this.message.set(null);
  }

  // The first photo is the one the app leads with.
  makePrimary(index: number): void {
    this.photos.update((photos) => [photos[index], ...photos.filter((_, i) => i !== index)]);
  }

  save(): void {
    this.value.set(this.photos());
    this.update.emit();
  }

  cancel(): void {
    this.update.emit();
  }
}
