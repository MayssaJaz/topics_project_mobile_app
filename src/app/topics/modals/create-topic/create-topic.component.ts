import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { TopicService } from 'src/app/services/topic.service';
import { ModalController } from '@ionic/angular/standalone';
import { Topic } from 'src/app/models/topic';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Observable, filter, firstValueFrom, map, of } from 'rxjs';
import { Category } from 'src/app/models/topic';
import { AuthService } from 'src/app/services/auth.service';
import { User } from '@angular/fire/auth';
import { Client } from 'src/app/models/client';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { AlertComponent } from '../../alert/alert.component';
import { ToastService } from 'src/app/services/toast.service';

addIcons({
  closeCircle,
});

@Component({
  selector: 'app-create-topic',
  imports: [ReactiveFormsModule, CommonModule, IonicModule],
  template: `
    <form [formGroup]="topicForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Topic</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="this.topicForm.invalid"
              [strong]="true"
              >Confirm</ion-button
            >
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" [fullscreen]="true">
        <ion-input
          formControlName="name"
          fill="solid"
          name="name"
          label="Enter book name"
          labelPlacement="floating"
          placeholder="Book name"
        ></ion-input>
        <ion-input
          formControlName="description"
          fill="solid"
          name="description"
          label="Enter book description"
          labelPlacement="floating"
          placeholder="Book description"
        ></ion-input>
        <ion-item
          fill="solid"
          name="category"
          label="Enter book category"
          labelPlacement="floating"
          placeholder="Book category"
        >
          <ion-select
            formControlName="category"
            label="Category"
            placeholder="Book category"
          >
            <ion-select-option *ngFor="let category of categories">
              {{ category }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-input
          placeholder="Add Readers"
          (ionInput)="searchUsers($event, 'readers')"
          formControlName="readerSearch"
        ></ion-input>
        <div *ngIf="filteredReaders$ | async as users">
          <ion-list *ngIf="users.length > 0">
            <ion-item
              *ngFor="let user of users"
              (click)="addUserHandler(user, 'readers')"
            >
              {{ user.name }} ({{ user.email }})
            </ion-item>
          </ion-list>
        </div>

        <div>
          <ion-chip *ngFor="let reader of readers.controls; let i = index">
            <ion-label>{{ reader.value.name }}</ion-label>
            <ion-icon
              name="close-circle"
              (click)="removeUser(reader.value.uid, 'readers')"
            ></ion-icon>
          </ion-chip>
        </div>

        <ion-input
          placeholder="Add Writers"
          (ionInput)="searchUsers($event, 'writers')"
          formControlName="writerSearch"
        ></ion-input>
        <div *ngIf="filteredWriters$ | async as users">
          <ion-list *ngIf="users.length > 0">
            <ion-item
              *ngFor="let user of users"
              (click)="addUserHandler(user, 'writers')"
            >
              {{ user.name }} ({{ user.email }})
            </ion-item>
          </ion-list>
        </div>

        <div>
          <ion-chip *ngFor="let writer of writers.controls; let i = index">
            <ion-label>{{ writer.value.name }}</ion-label>
            <ion-icon
              name="close-circle"
              (click)="removeUser(writer.value.uid, 'writers')"
            ></ion-icon>
          </ion-chip>
        </div>
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label position="stacked">Upload Book Cover</ion-label>
              <input
                type="file"
                (change)="onFileSelected($event)"
                accept="image/*"
                class="custom-file-input"
              />
            </ion-item>
            <div *ngIf="imagePreview" class="image-preview">
              <img [src]="imagePreview" alt="Book Cover Preview" />
            </div>
          </ion-col>
        </ion-row>
      </ion-content>
    </form>
  `,
})
export class CreateTopicModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);
  private alertService = inject(AlertComponent);

  readonly NAME_MIN_LENGTH = 3;
  readonly DESCRIPTION_MIN_LENGTH = 20;
  readonly USER_SEARCH_MIN_LENGTH = 3;

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  filteredReaders$: Observable<Client[]> = of([]);
  filteredWriters$: Observable<Client[]> = of([]);
  categories = Object.values(Category);
  private toastService = inject(ToastService);

  topic: Topic | undefined;

  ngOnInit(): void {
    if (this.topic) {
      this.topicNameControl?.setValue(this.topic.name);
      this.topicDescriptionControl?.setValue(this.topic.description);
      this.topicCategoryControl?.setValue(this.topic.category);

      if (this.topic.readers?.length) {
        this.loadUsersByIds(this.topic.readers, 'readers');
      }

      if (this.topic.writers?.length) {
        this.loadUsersByIds(this.topic.writers, 'writers');
      }
    }
  }

  loadUsersByIds(userIds: string[], type: 'readers' | 'writers') {
    const userArray = type === 'readers' ? this.readers : this.writers;

    userIds.forEach((userId) => {
      this.authService.getUserById(userId).subscribe((user) => {
        if (user) {
          userArray.push(this.fb.control(user));
        }
      });
    });
  }

  topicForm = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)],
    ],
    description: [
      '',
      [Validators.required, Validators.minLength(this.DESCRIPTION_MIN_LENGTH)],
    ],
    category: ['', [Validators.required]],
    readerSearch: [''],
    writerSearch: [''],
    readers: this.fb.array([]),
    writers: this.fb.array([]),
  });

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  errorText$: Observable<string> = this.topicForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.topicNameControl?.errors &&
        this.topicNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.topicNameControl?.errors &&
        this.topicNameControl?.errors['minlength']
      ) {
        return `Name should have at least ${this.NAME_MIN_LENGTH} characters`;
      }
      if (
        this.topicDescriptionControl?.errors &&
        this.topicDescriptionControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.topicDescriptionControl?.errors &&
        this.topicDescriptionControl?.errors['minlength']
      ) {
        return `Description should have at least ${this.DESCRIPTION_MIN_LENGTH} characters`;
      }
      if (
        this.topicCategoryControl?.errors &&
        this.topicCategoryControl?.errors['required']
      ) {
        return 'This field is required';
      }
      return '';
    })
  );

  errorText = toSignal(this.errorText$);

  get topicNameControl(): AbstractControl<string | null, string | null> | null {
    return this.topicForm.get('name');
  }

  get topicDescriptionControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.topicForm.get('description');
  }

  get topicCategoryControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.topicForm.get('category');
  }

  get readers(): FormArray {
    return this.topicForm.get('readers') as FormArray;
  }

  get writers(): FormArray {
    return this.topicForm.get('writers') as FormArray;
  }

  searchUsers(event: any, type: 'readers' | 'writers') {
    const searchTerm = event.target.value.trim();
    if (searchTerm.length >= this.USER_SEARCH_MIN_LENGTH) {
      if (type === 'readers') {
        this.filteredReaders$ =
          this.authService.getUsersByPartialNameOrEmail(searchTerm, this.topic);
      } else {
        this.filteredWriters$ =
          this.authService.getUsersByPartialNameOrEmail(searchTerm, this.topic);
      }
    } else {
      if (type === 'readers') {
        this.filteredReaders$ = of([]);
      } else {
        this.filteredWriters$ = of([]);
      }
    }
  }

  async addUserHandler(user: Client, type: 'readers' | 'writers') {

    const isInOppositeList =
    type === 'readers'
      ? this.writers.controls.some(ctrl => ctrl.value.uid === user.uid)
      : this.readers.controls.some(ctrl => ctrl.value.uid === user.uid);

    if (isInOppositeList) {
       await this.showConfirmationPopup(user, type);
    } else {
      this.addUser(user, type);
    }
  }

  addUser(user: Client, type: 'readers' | 'writers') {
    const userArray = type === 'readers' ? this.readers : this.writers;

    if (!userArray.controls.some((ctrl) => ctrl.value.uid === user.uid)) {
      userArray.push(this.fb.control(user));
    }

    if (type === 'readers') {
      this.topicForm.get('readerSearch')?.setValue('');
      this.filteredReaders$ = of([]);
    } else {
      this.topicForm.get('writerSearch')?.setValue('');
      this.filteredWriters$ = of([]);
    }
  }

  removeUser(userId: string | undefined, type: 'readers' | 'writers') {
    const userArray = type === 'readers' ? this.readers : this.writers;

    const index = userArray.controls.findIndex(ctrl => ctrl.value.uid === userId);
  
    if (index !== -1) {
      userArray.removeAt(index);
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  getUserId(): Observable<string | undefined> {
    return this.authService.getConnectedUser().pipe(map((user) => user?.uid));
  }

  async onSubmit(): Promise<void> {
    if (this.topic?.id) {
      this.topicService.editTopic({
        ...this.topic,
        name: this.topicForm.value.name!,
        readers: this.readers.value.map((user: User) => user.uid),
        writers: this.writers.value.map((user: User) => user.uid),
        description: this.topicForm.value.description!,
        category: (this.topicForm.value.category as Category)!,
      });
    } else {
      const ownerId = await firstValueFrom(this.getUserId());

      this.topicService.addTopic(
        {
          name: this.topicForm.value.name!,
          readers: this.readers.value.map((user: User) => user.uid),
          writers: this.writers.value.map((user: User) => user.uid),
          owner: ownerId,
          description: this.topicForm.value.description!,
          category: (this.topicForm.value.category as Category)!,
        },
        this.selectedFile ?? undefined
      );
    }
    this.modalCtrl.dismiss();
  }

  async showConfirmationPopup(user: Client,  type: 'readers' | 'writers') {
    await this.alertService.presentAlert(`This user is listed as a ${type.slice(0,type.length -1)} on this book. Are you sure you want to change him for a writer?`, () => {
      if (type === 'readers') {
        this.removeUser(user?.uid, 'writers');
      } else {
        this.removeUser(user?.uid, 'readers');
      }
      this.addUser(user, type);
    });
  }
}
