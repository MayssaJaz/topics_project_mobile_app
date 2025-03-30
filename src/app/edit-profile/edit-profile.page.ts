import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule, Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { arrowBack, createOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ModalController } from '@ionic/angular/standalone';
import { AddPictureComponent } from '../topics/modals/add-picture/add-picture.component';

addIcons({ createOutline, arrowBack });

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class EditProfilePage {
  private readonly fb = inject(FormBuilder);
  location = inject(Location);
  topicId!: string;
  private _authService = inject(AuthService);
  private name: string = '';
  private familyName: string = '';
  private uid: string = '';
  private logo: string = '';
  private email = '';
  private readonly modalCtrl = inject(ModalController);

  loading = signal<boolean>(true);

  get logoSrc(): string {
    return this.logo !== '' ? this.logo : 'assets/img/no_logo.jpg';
  }
  ngOnInit(): void {
    this._authService.getConnectedUser().subscribe((user) => {
      if (user)
        this._authService.getUserById(user.uid).subscribe((userDetails) => {
          if (userDetails) {
            this.uid = user.uid;
            this.name = userDetails.name;
            this.familyName = userDetails.family_name;
            this.email = userDetails.email;
            this.logo = userDetails.logo || '';
            this.userForm.patchValue({
              name: this.name,
              familyName: this.familyName,
            });
          }
        });
      this.loading.set(false);
    });
  }

  userForm = this.fb.group({
    name: ['', [Validators.required]],
    familyName: ['', [Validators.required]],
  });

  nameErrorText$: Observable<string> = this.userForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.userNameControl?.errors &&
        this.userNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      return '';
    })
  );

  familyNameErrorText$: Observable<string> = this.userForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.userNameControl?.errors &&
        this.userNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      return '';
    })
  );

  nameErrorText = toSignal(this.nameErrorText$);
  familyNameErrorText = toSignal(this.familyNameErrorText$);

  get userNameControl(): AbstractControl<string | null, string | null> | null {
    return this.userForm.get('name');
  }

  get userFamilyNameControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.userForm.get('familyName');
  }

  cancel(): void {
    this.location.back();
  }
  onSubmit(): void {
    this._authService.editUser(
      this.uid,
      this.userNameControl?.value ?? '',
      this.userFamilyNameControl?.value ?? ''
    );
  }

  async openModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddPictureComponent,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.logo = data;
      this._authService.editProfilePicture(this.uid, data);
    }
  }

  editProfilePicture(): void {
    this.openModal();
  }

  async forgotPassword(): Promise<void> {
    await this._authService.sendResetPasswordLink(this.email);
  }
}
