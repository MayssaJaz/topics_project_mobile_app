import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { filter, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { Location } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonButton, IonButtons, IonInput, IonIcon, IonRow, IonCol, IonSpinner} from '@ionic/angular/standalone';

addIcons({ arrowBack });

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.page.html',
  styleUrls: ['./forget-password.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonButton, IonButtons, IonInput, IonIcon, IonRow, IonCol],
})
export class ForgetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  location = inject(Location);
  topicId!: string;
  private _authService = inject(AuthService);

  ngOnInit(): void {}

  userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  emailErrorText$: Observable<string> = this.userForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.userEmailControl?.errors &&
        this.userEmailControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (this.userEmailControl?.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      return '';
    })
  );

  emailErrorText = toSignal(this.emailErrorText$);

  get userEmailControl(): AbstractControl<string | null, string | null> | null {
    return this.userForm.get('email');
  }

  cancel(): void {
    this.location.back();
  }

  onSubmit(): void {
    this._authService.sendResetPasswordLink(this.userEmailControl?.value ?? '');
  }
}
