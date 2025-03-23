import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleStorageService {
  private backendUrl = 'http://localhost:3000/generate-signed-url';

  constructor() {}

  async uploadFile(file: File): Promise<string> {
    try {
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b//o?uploadType=media&name=${file.name}`;
      const accessToken = environment.accessToken;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          Authorization: `Bearer ${accessToken}`,
        },
        body: file,
      });

      if (!response.ok) {
        console.log(await response.text());
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const fileName = data.name;

      const signedUrlResponse = await fetch(
        `${this.backendUrl}?fileName=${fileName}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!signedUrlResponse.ok) {
        console.error(await signedUrlResponse.text());
        throw new Error('Error generating signed URL');
      }

      const signedUrlData = await signedUrlResponse.json();
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}
