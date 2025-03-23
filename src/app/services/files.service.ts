import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleStorageService {
  private apiUrl = 'http://localhost:3000/upload';
  constructor() {}

  async uploadFile(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch(
        `${this.apiUrl}?fileName=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`File upload failed: ${errorMessage}`);
      }

      const result = await response.json();
      return result.publicUrl;
    } catch (error) {
      throw new Error('File upload failed!');
    }
  }
}
