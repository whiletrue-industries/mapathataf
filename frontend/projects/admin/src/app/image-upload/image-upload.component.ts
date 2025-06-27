import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.less'
})
export class ImageUploadComponent implements AfterViewInit{
  @Input() value: WritableSignal<string | null>;
  @Output() update = new EventEmitter<void>();

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;

  dataUrl = signal<string | null>(null);

  ngAfterViewInit(): void {
      this.clicker();
  }

  clicker() {
    console.log('ImageUploadComponent: clicker');
    this.fileInput?.nativeElement?.click();
  }

  async processImage(e: Event) {
    console.log('ImageUploadComponent: processImage', e);
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    /* 1-2) decode & resize (max width 1024, keep aspect) */
    const bmp   = await createImageBitmap(file);          // fast everywhere except iOS ≤ 12
    const scale = Math.min(1, 1024 / bmp.width);
    const w     = Math.round(bmp.width  * scale);
    const h     = Math.round(bmp.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    context.drawImage(bmp, 0, 0, w, h);

    /* 3-4) to JPEG @ 85 % and stash the Data-URI */
    this.dataUrl.set(canvas.toDataURL('image/jpeg', 0.85));
    console.log('ImageUploadComponent: processImage - dataUrl', this.dataUrl());
  }

  save(): void {
    this.value.set(this.dataUrl());
    this.update.emit();
  }

  cancel(): void {
    this.update.emit();
  }
}
