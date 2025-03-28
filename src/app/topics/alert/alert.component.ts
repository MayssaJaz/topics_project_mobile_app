import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AlertComponent {
  private readonly alertController = inject(AlertController);

  async presentAlert(message: string, confirmHandler: () => void) {
    const alert = await this.alertController.create({
      header: 'Action Confirmation',
      message,
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Yes', role: 'confirm', handler: confirmHandler },
      ],
    });

    await alert.present();
  }
}
