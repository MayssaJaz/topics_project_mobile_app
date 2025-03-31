import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { UserPopoverComponent } from '../popover/user-management/user-management.component';
import {
  PopoverController,
  IonHeader,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonTitle
} from '@ionic/angular/standalone';

addIcons({
  addOutline,
  chevronForward,
  ellipsisVertical,
});

@Component({
  selector: 'header-component',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-img
            src="assets/img/logo.png"
            alt="Book's Club"
            class="header-logo"
            [routerLink]="['/topics/']"
          ></ion-img>
        </ion-buttons>
        <ion-title>Book's Club</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="presentUserPopover($event)">
            <ion-icon slot="icon-only" name="person-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [
    `
      /* Header adjustments */
      ion-header {
        ion-toolbar {
          &:first-child {
            padding-top: var(--ion-safe-area-top);
          }
        }
      }

      /* Rest of your existing styles... */
      .header-logo {
        width: 30px;
        height: 30px;
        margin-right: 8px;
      }
    `,
  ],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon,
    IonTitle
    
  ],
  standalone: true,
})
export class HeaderComponent {
  private readonly popoverCtrl = inject(PopoverController);

  async presentUserPopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: UserPopoverComponent,
      event,
      showBackdrop: true,
      translucent: true,
    });

    await popover.present();
  }
}
