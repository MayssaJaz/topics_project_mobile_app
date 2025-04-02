import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastCtrl = inject(ToastController);

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {

    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
    });

    await toast.present();
  }
}