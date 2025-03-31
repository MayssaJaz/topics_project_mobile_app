import { CommonModule, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ModalController,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonButtons,
  IonTitle
} from '@ionic/angular/standalone';
import { GoogleStorageService } from 'src/app/services/files.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-add-picture',
  standalone: true,
  imports: [CommonModule, NgIf, ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonButtons,
    IonTitle],
  template: `
    <form [formGroup]="pictureForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Add Picture</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="pictureForm.invalid"
              [strong]="true"
              >Confirm</ion-button
            >
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" [fullscreen]="true">
        <input type="file" (change)="onFileSelected($event)" accept="image/*" />
        <p
          *ngIf="
            pictureForm.controls['image'].invalid &&
            pictureForm.controls['image'].touched
          "
          class="error"
        >
          Please select an image file.
        </p>
      </ion-content>
    </form>
  `,
})
export class AddPictureComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  storageService = inject(GoogleStorageService);

  pictureForm!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.pictureForm = this.fb.group({
      image: [null, Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.pictureForm.patchValue({ image: this.selectedFile });
      this.pictureForm.get('image')?.updateValueAndValidity();
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  async uploadFile(file: File): Promise<string | Error> {
    if (file) {
      try {
        const fileUrl = await this.storageService.uploadFile(file);
        return fileUrl;
      } catch (error) {
        this.toastService.presentToast('Error uploading file', 'danger');
        return new Error('File upload failed');
      }
    }
    this.toastService.presentToast('No image selected', 'danger');
    return new Error('No file selected');
  }

  async onSubmit(): Promise<void> {
    if (this.pictureForm.valid && this.selectedFile) {
      const uploadResult = await this.uploadFile(this.selectedFile);

      if (uploadResult instanceof Error) {
        return;
      } else {
        this.modalCtrl.dismiss(uploadResult);
      }
    }
  }
}
