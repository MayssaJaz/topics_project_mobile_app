import { Component, inject } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  createOutline,
  logOutOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
addIcons({
  personCircleOutline,
  createOutline,
  logOutOutline,
});

@Component({
  selector: 'app-user-popover',
  imports: [IonicModule, CommonModule],
  template: `
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item button (click)="editProfile()">
          <ion-icon slot="start" name="create-outline"></ion-icon>
          Edit Profile
        </ion-item>
        <ion-item button (click)="logout()">
          <ion-icon slot="start" name="log-out-outline"></ion-icon>
          Logout
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class UserPopoverComponent {
  constructor(private popoverCtrl: PopoverController) {}
  private readonly authService = inject(AuthService);
  private router = inject(Router);

  editProfile() {
    this.router.navigate(['/edit-profile'])
    this.popoverCtrl.dismiss();
  }

  async logout() {
    await this.authService.logout();
    this.popoverCtrl.dismiss();
  }
}
