import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';
import { MAX_PHOTOS } from '../../../../app/src/app/photos';

function pngFile(name: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(new File([blob!], name, { type: 'image/png' })), 'image/png'));
}

describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;
  let component: ImageUploadComponent;
  let value: WritableSignal<string[] | null>;
  let updates: number;
  let pickerOpened: jasmine.Spy;

  function setup(initial: string[] | null) {
    // The component opens the native file picker by itself; keep that out of the test run.
    pickerOpened = spyOn(HTMLInputElement.prototype, 'click');
    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    value = signal(initial);
    component.value = value;
    updates = 0;
    component.update.subscribe(() => updates++);
    fixture.detectChanges();
  }

  function pick(files: File[]) {
    const input = { files, value: 'C:\\fakepath' } as unknown as HTMLInputElement;
    return component.processImages({ target: input } as unknown as Event);
  }

  it('opens the picker straight away only when there is nothing to show', () => {
    setup(null);
    expect(pickerOpened).toHaveBeenCalledTimes(1);
  });

  it('shows the existing photos instead of opening the picker', () => {
    setup(['a', 'b']);
    expect(pickerOpened).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.photo img').length).toBe(2);
  });

  it('adds picked photos to the draft without touching the value', async () => {
    setup(['a']);
    await pick([await pngFile('1.png'), await pngFile('2.png')]);
    expect(component.photos().length).toBe(3);
    expect(component.photos()[1].startsWith('data:image/jpeg')).toBeTrue();
    expect(value()).toEqual(['a']);
  });

  it(`stops at ${MAX_PHOTOS} photos and says so`, async () => {
    setup(['a', 'b', 'c', 'd']);
    await pick([await pngFile('1.png'), await pngFile('2.png')]);
    expect(component.photos().length).toBe(MAX_PHOTOS);
    expect(component.full()).toBeTrue();
    expect(component.message()).toContain(`${MAX_PHOTOS}`);
    fixture.detectChanges();
    const add = fixture.nativeElement.querySelector('.controls button') as HTMLButtonElement;
    expect(add.disabled).toBeTrue();
  });

  it('reports a file it could not read and keeps the rest', async () => {
    setup(['a']);
    spyOn(console, 'error');
    await pick([new File(['nope'], 'broken.jpg', { type: 'image/jpeg' }), await pngFile('ok.png')]);
    expect(component.photos().length).toBe(2);
    expect(component.message()).toBeTruthy();
  });

  it('removes a photo and promotes one to primary', () => {
    setup(['a', 'b', 'c']);
    component.makePrimary(2);
    expect(component.photos()).toEqual(['c', 'a', 'b']);
    component.remove(1);
    expect(component.photos()).toEqual(['c', 'b']);
  });

  it('writes the draft to the value only on save', () => {
    setup(['a', 'b']);
    component.remove(0);
    component.cancel();
    expect(value()).toEqual(['a', 'b']);
    expect(updates).toBe(1);
    component.save();
    expect(value()).toEqual(['b']);
    expect(updates).toBe(2);
  });

  it('leaves the edit when the self-opened picker is dismissed', () => {
    setup(null);
    component.pickerCancelled();
    expect(updates).toBe(1);
  });

  it('stays in the edit when the picker is dismissed with photos on hand', () => {
    setup(['a']);
    component.pickerCancelled();
    expect(updates).toBe(0);
  });
});
