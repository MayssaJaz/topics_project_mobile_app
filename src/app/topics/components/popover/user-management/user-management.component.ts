import { Component, inject } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  createOutline,
  logOutOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { AlertComponent } from '../../alert/alert.component';
import { ToastService } from 'src/app/services/toast.service';
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
  private alertService = inject(AlertComponent);
  private toastService = inject(ToastService);

  editProfile() {
    this.router.navigate(['/edit-profile']);
    this.popoverCtrl.dismiss();
  }

  async logout() {
    await this.alertService.presentAlert('Are you sure you want to logout?', () => {
      this.authService.logout().then(() => {
        this.toastService.presentToast('You have successfully logged out', 'success');
        this.router.navigate(['/login']);
      }).catch((error) => {
        this.toastService.presentToast('Logout failed: ' + error.message, 'danger');
      });
    });

    this.popoverCtrl.dismiss();
  }
}
