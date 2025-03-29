import { Component, computed, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TopicService } from '../services/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ToastController } from '@ionic/angular';
import { ModalController, PopoverController } from '@ionic/angular/standalone';
import { UserPopoverComponent } from './popover/user-management/user-management.component';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './popover/item-management/item-management.component';
import { Category, Topic } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { of, switchMap, tap } from 'rxjs';
import { BehaviorSubject, combineLatest } from 'rxjs';

addIcons({
  addOutline,
  chevronForward,
  ellipsisVertical,
});

@Component({
  selector: 'app-home',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-breadcrumbs>
          <ion-breadcrumb routerLink="">Book Discussion</ion-breadcrumb>
        </ion-breadcrumbs>

        <ion-buttons slot="end">
          <ion-button (click)="presentUserPopover($event)">
            <ion-icon slot="icon-only" name="person-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Books</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-grid>
          <ion-row class="filter-row">
            <ion-col size="3">
              <ion-searchbar
                debounce="1000"
                [ngModel]="searchQuery$"
                (ngModelChange)="filterData()"
                placeholder="Search by name"
              >
              </ion-searchbar>
            </ion-col>
            <ion-col size="3">
              <ion-item>
                <ion-label>Category</ion-label>
                <ion-select
                  [ngModel]="selectedCategory$"
                  (ngModelChange)="filterData()"
                >
                  <ion-select-option
                    *ngFor="let category of categories"
                    [value]="category"
                  >
                    {{ category }}</ion-select-option
                  >
                </ion-select>
              </ion-item>
            </ion-col>
            <ion-col size="3">
              <ion-item>
                <ion-label>Role</ion-label>
                <ion-select
                  [(ngModel)]="selectedRole"
                  (ngModelChange)="filterData()"
                >
                  <ion-select-option
                    *ngFor="let role of roles"
                    [value]="role"
                    >{{ role }}</ion-select-option
                  >
                </ion-select>
              </ion-item>
            </ion-col>

            <ion-col size="3" class="button-container">
              <ion-button fill="outline" (click)="cancelFilter()"
                >Cancel</ion-button
              >
            </ion-col>
          </ion-row>
        </ion-grid>
        <ion-list *ngIf="!loading(); else loadingTemplate">
          @for(topic of topics(); track topic.id) {
          <ion-card>
            <ion-item id="edit-bar">
              <ion-button
                slot="start"
                fill="clear"
                id="click-trigger"
                (click)="
                  presentTopicManagementPopover($event, topic);
                  $event.stopPropagation()
                "
                aria-label="open topic management popover"
                data-cy="open-topic-management-popover"
              >
                <ion-icon
                  slot="icon-only"
                  color="medium"
                  name="ellipsis-vertical"
                ></ion-icon>
              </ion-button>
            </ion-item>

            <img
              alt="Book Cover"
              [src]="topic.cover"
              class="full-width-image"
            />

            <ion-item [routerLink]="['/topics/' + topic.id]" button>
              <ion-grid>
                <ion-row>
                  <ion-col>
                    <ion-card-title>{{ topic.name }}</ion-card-title>
                  </ion-col>
                </ion-row>

                <ion-row>
                  <ion-col>
                    <ion-card-subtitle>{{ topic.category }}</ion-card-subtitle>
                  </ion-col>
                </ion-row>

                <ion-row>
                  <ion-col>
                    <h3>Summary:</h3>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col>
                    <ion-card-content>
                      {{ topic.description }}
                    </ion-card-content>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-item>
          </ion-card>
          } @empty {
          <ion-img class="image" src="assets/img/no_data.svg" alt=""></ion-img>
          }
        </ion-list>
        <ng-template #loadingTemplate>
          <ion-list>
            <ion-list-header>
              <ion-skeleton-text
                [animated]="true"
                style="width: 80px"
              ></ion-skeleton-text>
            </ion-list-header>
            <ion-item>
              <ion-thumbnail slot="start">
                <ion-skeleton-text [animated]="true"></ion-skeleton-text>
              </ion-thumbnail>
              <ion-label>
                <h3>
                  <ion-skeleton-text
                    [animated]="true"
                    style="width: 80%;"
                  ></ion-skeleton-text>
                </h3>
                <p>
                  <ion-skeleton-text
                    [animated]="true"
                    style="width: 60%;"
                  ></ion-skeleton-text>
                </p>
                <p>
                  <ion-skeleton-text
                    [animated]="true"
                    style="width: 30%;"
                  ></ion-skeleton-text>
                </p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ng-template>
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button
            data-cy="open-create-topic-modal-button"
            aria-label="open add topic modal"
            (click)="openModal()"
          >
            <ion-icon name="add-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </ion-content>
  `,
  styles: [
    `
      .image::part(image) {
        width: 50%;
        margin: auto;
      }
      .loading-spinner {
        display: block;
        margin: auto;
        margin-top: 50px;
      }
      .full-width-image {
        width: 100%;
        max-height: 500px;
        object-fit: contain;
        display: block;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
      #edit-bar {
        padding-bottom: 2%;
      }
      .filter-row {
        display: flex;
        justify-content: space-between; /* Distributes items evenly */
        align-items: center;
      }

      .button-container {
        display: flex;
        justify-content: flex-end; /* Pushes button to the right */
      }
    `,
  ],
  imports: [IonicModule, CommonModule, RouterLink, FormsModule],
})
export class TopicsPage {
  private readonly topicService = inject(TopicService);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);
  private readonly authService = inject(AuthService);
  filteredData = [];
  categories = Object.values(Category);
  roles = ['Reader', 'Writer', 'Owner'];

  filterApplied$: boolean = false;
  searchQuery$: string = '';
  selectedCategory$: string = '';
  selectedRole: string = '';

  loading = signal(false);

  topics = toSignal<Topic[] | undefined>(
    this.topicService.getAll().pipe(tap(() => this.loading.set(false)))
  );

  filterData() {
    this.loading.set(true);

    const currentTopics = this.topics();
    console.log('Current Topics:', currentTopics);

    this.loading.set(false);
  }

  cancelFilter() {
    this.searchQuery$ = '';
    this.selectedCategory$ = '';
    this.selectedRole = '';
    this.filterApplied$ = false;
  }

  async openModal(topic?: Topic): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: { topic },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentUserPopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: UserPopoverComponent,
      event,
      showBackdrop: true,
      translucent: true,
    });

    await popover.present();
  }

  async presentTopicManagementPopover(event: Event, topic: Topic) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      componentProps: { topic },
    });

    await popover.present();

    const {
      data: { action },
    } = await popover.onDidDismiss();

    if (action === 'remove') this.topicService.removeTopic(topic);
    else if (action === 'edit') this.openModal(topic);
  }
}
