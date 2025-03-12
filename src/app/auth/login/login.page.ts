import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, StatusChangeEvent, TouchedChangeEvent, Validators, } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { filter, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [IonicModule, ReactiveFormsModule, CommonModule],
    template: `
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <ion-header>
          <ion-toolbar>
            <ion-title>Login</ion-title>
            <ion-buttons slot="end">
              <ion-button
                type="submit"
                [disabled]="this.loginForm.invalid"
                [strong]="true"
                >Login</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding" [fullscreen]="true">
          <ion-input
            formControlName="email"
            fill="solid"
            name="email"
            label="Enter login email"
            labelPlacement="floating"
            placeholder="login email"
            [helperText]="'Enter a login email in the format user@email.com'"
          ></ion-input>
          <ion-input
            formControlName="password"
            fill="solid"
            name="password"
            label="Enter login password"
            labelPlacement="floating"
            placeholder="login password"
            [helperText]="
              'Enter a password with at least ' + PASSWORD_MIN_LENGTH + ' characters.'
            "
          ></ion-input>
          <ion-button expand="full" fill="clear" (click)="forgotPassword()">Mot de passe oublié ?</ion-button>
          <ion-button expand="full" fill="clear" (click)="goToRegister()">Créer un compte</ion-button>
        </ion-content>
      </form>
    `,
  standalone: true,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  constructor() { }


  readonly PASSWORD_MIN_LENGTH = 4;

  loginForm = this.fb.group({
    password: [
      '',
      [Validators.required, Validators.minLength(this.PASSWORD_MIN_LENGTH)],
    ],
    email: [
      '',
      [Validators.required, Validators.email],
    ],
  });
  
  errorText$: Observable<string> = this.loginForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.loginEmailControl?.errors &&
        this.loginEmailControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.loginPasswordControl?.errors &&
        this.loginPasswordControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.loginPasswordControl?.errors &&
        this.loginPasswordControl?.errors['minlength']
      ) {
        return `Password should have at least ${this.PASSWORD_MIN_LENGTH} characters`;
      }
      if (
        this.loginEmailControl?.errors &&
        this.loginEmailControl?.errors['email']
      ) {
        return `E-mail not valid`;
      }
      return '';
    })
  );

  errorText = toSignal(this.errorText$);

  get loginEmailControl(): AbstractControl<string | null, string | null> | null {
    return this.loginForm.get('email');
  }

  get loginPasswordControl(): AbstractControl<string | null, string | null> | null {
    return this.loginForm.get('password');
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.value.email && this.loginForm.value.password) {
      const result = await this.authService.login(this.loginForm.value.email, this.loginForm.value.password);
      if(result?.user?.email) {
          this.router.navigate(['/topics']);
      }
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']); 
  }

  forgotPassword(): void {
    this.router.navigate(['/password-recover']);
  }
}
