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
import { Observable, filter, firstValueFrom, map, of } from 'rxjs';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonInput, IonList, IonChip, IonItem, IonIcon, IonLabel} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { User } from '@angular/fire/auth';
import { Client } from 'src/app/models/client';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
addIcons({
  closeCircle
});
@Component({
  selector: 'app-create-topic',
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonInput, ReactiveFormsModule, CommonModule, IonList, IonChip, IonItem, IonIcon, IonLabel],
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
          label="Enter topic name"
          labelPlacement="floating"
          placeholder="Topic name"
          [helperText]="
            'Enter a name with at least ' + NAME_MIN_LENGTH + ' characters.'
          "
        ></ion-input>
        <ion-input placeholder="Add Readers" (ionInput)="searchUsers($event, 'readers')" formControlName="readerSearch"></ion-input>
        <div *ngIf="filteredReaders$ | async as users">
          <ion-list *ngIf="users.length > 0">
            <ion-item *ngFor="let user of users" (click)="addUser(user, 'readers')">
              {{ user.name }} ({{ user.email }})
            </ion-item>
          </ion-list>
        </div>

        <div>
          <ion-chip *ngFor="let reader of readers.controls; let i = index">
            <ion-label>{{ reader.value.name }}</ion-label>
            <ion-icon name="close-circle" (click)="removeUser(i, 'readers')"></ion-icon>
          </ion-chip>
        </div>

        <ion-input placeholder="Add Writers" (ionInput)="searchUsers($event, 'writers')" formControlName="writerSearch"></ion-input>
        <div *ngIf="filteredWriters$ | async as users">
          <ion-list *ngIf="users.length > 0">
            <ion-item *ngFor="let user of users" (click)="addUser(user, 'writers')">
              {{ user.name }} ({{ user.email }})
            </ion-item>
          </ion-list>
        </div>  

        <div>
          <ion-chip *ngFor="let writer of writers.controls; let i = index">
            <ion-label>{{ writer.value.name }}</ion-label>
            <ion-icon name="close-circle" (click)="removeUser(i, 'writers')"></ion-icon>
          </ion-chip>
        </div>

      </ion-content>
    </form>
  `,
})
export class CreateTopicModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly NAME_MIN_LENGTH = 3;
  readonly USER_SEARCH_MIN_LENGTH = 3;
  filteredReaders$: Observable<Client[]> = of([]);
  filteredWriters$: Observable<Client[]> = of([]);

  topic: Topic | undefined;

  ngOnInit(): void {
    if (this.topic) {
      this.topicNameControl?.setValue(this.topic.name);
  
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
  
    userIds.forEach(userId => {
      this.authService.getUserById(userId).subscribe(user => {
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
    readerSearch: [''],
    writerSearch: [''],
    readers: this.fb.array([]),
    writers: this.fb.array([])
  });

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
      return '';
    })
  );

  errorText = toSignal(this.errorText$);

  get topicNameControl(): AbstractControl<string | null, string | null> | null {
    return this.topicForm.get('name');
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
        this.filteredReaders$ = this.authService.getUsersByPartialNameOrEmail(searchTerm);
      } else {
        this.filteredWriters$ = this.authService.getUsersByPartialNameOrEmail(searchTerm);
      }
    } else {
      if (type === 'readers') {
        this.filteredReaders$ = of([]);
      } else {
        this.filteredWriters$ = of([]);
      }
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

  removeUser(index: number, type: 'readers' | 'writers') {
    const userArray = type === 'readers' ? this.readers : this.writers;
    userArray.removeAt(index);
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  getUserId(): Observable<string | undefined> {
    return this.authService.getConnectedUser().pipe(
      map((user) => user?.uid)
    );
  }

  async onSubmit(): Promise<void> {
    if (this.topic?.id) {
      this.topicService.editTopic({
        ...this.topic,
        name: this.topicForm.value.name!,
        readers: this.readers.value.map((user: User) => user.uid),
        writers: this.writers.value.map((user: User) => user.uid),
      });
    } else {
      const ownerId = await firstValueFrom(this.getUserId());

      this.topicService.addTopic({
        name: this.topicForm.value.name!,
        readers: this.readers.value.map((user: User) => user.uid),
        writers: this.writers.value.map((user: User) => user.uid),
        owner: ownerId
      });
    } 
    this.modalCtrl.dismiss();
  }
}
