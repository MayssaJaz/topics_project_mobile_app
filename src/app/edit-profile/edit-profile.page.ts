import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, Observable } from 'rxjs';
import { Post } from '../models/post';
import { TopicService } from '../services/topic.service';
import { ModalController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { createOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({ createOutline });

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class EditProfilePage {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  topicId!: string;
  post: Post | undefined;
  private _authService = inject(AuthService);
  private name: string = '';
  private familyName: string = '';
  private logo: string = '';
  ngOnInit(): void {
    this._authService.getConnectedUser().subscribe((user) => {
      if (user)
        this._authService.getUserById(user.uid).subscribe((userDetails) => {
          if (userDetails) {
            this.name = userDetails.name;
            this.familyName = userDetails.family_name;
            this.logo = userDetails.logo || '';
            this.userForm.patchValue({
              name: this.name,
              familyName: this.familyName,
            });
          }
        });
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
    this.modalCtrl.dismiss();
  }

  onSubmit(): void {
    if (this.post?.id) {
      this.topicService.editPost(this.topicId, {
        ...this.post,
        name: this.userForm.value.name!,
        description: this.userForm.value.familyName!,
      });
    } else {
      this.topicService.addPost(this.topicId, {
        name: this.userForm.value.name!,
        description: this.userForm.value.familyName!,
      });
    }

    this.modalCtrl.dismiss();
  }

  editProfilePicture(): void {
    console.log('Edit profile picture');
  }
}
