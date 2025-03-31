import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonInput} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { filter, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';

export const emailMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const email = control.get('email')?.value;
  const confirmeEmail = control.get('confirmeEmail')?.value;
  return email === confirmeEmail ? null : { emailsNotMatching: true };
};

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonInput],
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-title>register</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="this.registerForm.invalid"
              [strong]="true"
              >Register</ion-button
            >
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" [fullscreen]="true">
        <ion-input
          formControlName="email"
          fill="solid"
          name="email"
          label="Enter register email"
          labelPlacement="floating"
          placeholder="email"
          [helperText]="
            'Enter a email in the format user@email.com to be registered'
          "
        ></ion-input>
        <ion-input
          formControlName="confirmeEmail"
          fill="solid"
          name="confirmeEmail"
          label="Enter register email"
          labelPlacement="floating"
          placeholder="confirme email"
          [helperText]="'Confirme your e-mail'"
        ></ion-input>
        <ion-input
          formControlName="name"
          fill="solid"
          name="name"
          label="Enter your name"
          labelPlacement="floating"
          placeholder="name"
          [helperText]="'Enter register name'"
        ></ion-input>
        <ion-input
          formControlName="familyName"
          fill="solid"
          name="familyName"
          label="Enter register family name"
          labelPlacement="floating"
          placeholder="family name"
          [helperText]="'Enter your family name'"
        ></ion-input>
        <ion-input
          formControlName="password"
          fill="solid"
          name="password"
          type="password"
          label="Enter register password"
          labelPlacement="floating"
          placeholder="register password"
          [helperText]="
            'Enter a password with at least ' +
            PASSWORD_MIN_LENGTH +
            ' characters.'
          "
        ></ion-input>
      </ion-content>
    </form>
  `,
  standalone: true,
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  
  constructor() {}

  readonly PASSWORD_MIN_LENGTH = 6;

  registerForm = this.fb.group(
    {
      name: ['', [Validators.required]],
      familyName: ['', [Validators.required]],
      password: [
        '',
        [Validators.required, Validators.minLength(this.PASSWORD_MIN_LENGTH)],
      ],
      email: ['', [Validators.required, Validators.email]],
      confirmeEmail: ['', [Validators.required, Validators.email]],
    },
    { validators: emailMatchValidator }
  );

  errorText$: Observable<string> = this.registerForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.registerEmailControl?.errors &&
        this.registerEmailControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.registerConfirmeEmailControl?.errors &&
        this.registerConfirmeEmailControl?.errors['required']
      ) {
        return 'This field is required';
      }

      if (
        this.registerNameControl?.errors &&
        this.registerNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.registerFamilyNameControl?.errors &&
        this.registerFamilyNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.registerPasswordControl?.errors &&
        this.registerPasswordControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.registerPasswordControl?.errors &&
        this.registerPasswordControl?.errors['minlength']
      ) {
        return `Password should have at least ${this.PASSWORD_MIN_LENGTH} characters`;
      }
      if (
        this.registerEmailControl?.errors &&
        this.registerEmailControl?.errors['email']
      ) {
        return `E-mail not valid`;
      }
      if (
        this.registerConfirmeEmailControl?.errors &&
        this.registerConfirmeEmailControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (this.registerForm.value.email != this.registerForm.value.email) {
        return 'This field is required';
      }
      if (this.registerForm.errors?.['emailsNotMatching'])
        return 'Emails do not match';
      return '';
    })
  );

  errorText = toSignal(this.errorText$);

  get registerEmailControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.registerForm.get('email');
  }

  get registerConfirmeEmailControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.registerForm.get('confirmeEmail');
  }

  get registerNameControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.registerForm.get('name');
  }

  get registerFamilyNameControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.registerForm.get('familyName');
  }

  get registerPasswordControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.registerForm.get('password');
  }

  async onSubmit(): Promise<void> {
    if (
      this.registerForm.value.email &&
      this.registerForm.value.password &&
      this.registerForm.value.name &&
      this.registerForm.value.familyName
    ) {
      try {
        await this.authService.register(
          this.registerForm.value.email,
          this.registerForm.value.name,
          this.registerForm.value.familyName,
          this.registerForm.value.password
        );
        this.toastService.presentToast(
          'Please confirm your email and go back to login',
          'success'
        );
      } catch (error) {
        console.log(error);
        this.toastService.presentToast(
          'A error happened while creating your accounting. Try again!',
          'danger'
        );
      }
    }
  }
}
