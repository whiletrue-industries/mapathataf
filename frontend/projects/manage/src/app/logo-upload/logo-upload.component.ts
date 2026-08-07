import { Component, inject, input, signal } from '@angular/core';
import { ApiService } from '../api.service';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

@Component({
  selector: 'app-logo-upload',
  imports: [],
  templateUrl: './logo-upload.component.html',
  styleUrl: './logo-upload.component.less'
})
export class LogoUploadComponent {
  workspaceId = input.required<string>();
  logoUrl = input<string | undefined>(undefined);

  api = inject(ApiService);

  file = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  busy = signal(false);
  error = signal<string | null>(null);
  currentBroken = signal(false);

  fileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    (event.target as HTMLInputElement).value = '';
    this.error.set(null);
    if (!file) {
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.error.set('סוג קובץ לא נתמך (png / jpg / svg / webp)');
      return;
    }
    if (file.size > MAX_SIZE) {
      this.error.set('הקובץ גדול מדי (מקסימום 2MB)');
      return;
    }
    this.file.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  cancel() {
    this.file.set(null);
    this.previewUrl.set(null);
    this.error.set(null);
  }

  upload() {
    const file = this.file();
    if (!file || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.api.uploadLogo(this.workspaceId(), file).subscribe({
      next: () => {
        this.busy.set(false);
        this.currentBroken.set(false);
        this.cancel();
      },
      error: () => {
        this.busy.set(false);
        this.error.set('העלאת הלוגו נכשלה');
      },
    });
  }
}
