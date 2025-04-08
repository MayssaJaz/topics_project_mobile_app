# 📚 Book Share App

This is a mobile application for a bookstore community where users can share books and give their feedback. The app is designed to connect **owners**, **readers**, and **writers** of a book in a simple and interactive platform.

## ✨ Features

- Users can **share books** with the community.
- Other users can **react** to books (like or other reactions).
- Users can also **leave comments/feedback** on a book.

## 🚀 How to Run the App
1. **Configure a .env file inside the `back` folder:**
```env
- KEY_JSON = Path to the Google Cloud authentication JSON file. This file is required to authenticate and access your Google Cloud Storage (GCS) buckets.

- BUCKET_NAME = The name of your Google Cloud Storage bucket where files (Book covers, profile pictures) will be stored.
```

2. **Start the backend server**:
   ```bash
   cd back
   npm install
   node auth.js
   ```
   
3. **Start frontend server (In another terminal):** 
```bash
  ionic serve
```
