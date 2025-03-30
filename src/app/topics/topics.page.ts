import { Component, inject, OnInit, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TopicService } from '../services/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ToastController } from '@ionic/angular';
import { ModalController, PopoverController } from '@ionic/angular/standalone';
import { UserPopoverComponent } from './components/popover/user-management/user-management.component';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './components/popover/item-management/item-management.component';
import { Topic } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReactionsComponent } from "./components/reactions/reactions.component";

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

          <img alt="Book Cover" [src]="topic.cover" class="full-width-image" />

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
                  <ion-card-content> {{ topic.description }} </ion-card-content>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-item>
          <ion-item>
          <ion-row>
            <ion-col>
              <app-reactions [topic]="topic" [userId]="userId"></app-reactions>
            </ion-col>
          </ion-row>
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
    `,
  ],
  imports: [IonicModule, CommonModule, RouterLink, ReactionsComponent],
})
export class TopicsPage implements OnInit {

  private readonly topicService = inject(TopicService);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);
  private readonly authService = inject(AuthService);
  userId: string | undefined;
  loading = signal<boolean>(true);
  topics = toSignal<Topic[]>(
    this.topicService.getAll().pipe(tap(() => this.loading.set(false)))
  );

  async ngOnInit() {
    this.userId = await firstValueFrom(this.authService.getUserId());

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
