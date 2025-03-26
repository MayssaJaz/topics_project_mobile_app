const express = require('express');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// Scan env variables
require('dotenv').config();


// Initialize the Google Cloud Storage with key credentials
const storage = new Storage({
  keyFilename: process.env.KEY_JSON,
});

const app = express();
const port = 3000;

// Enable CORS for all origins
app.use(cors({
  origin: '*', 
}));


// Use express-fileupload middleware for file uploads
app.use(fileUpload());


const bucketName = process.env.BUCKET_NAME;

// Endpoint to upload file
app.post('/upload', async (req, res) => {
  const fileName = req.query.fileName;
  if (!fileName) {
    return res.status(400).send('Error: fileName query parameter is required.');
  }

  const fileNameWithTimestamp = fileName + "_" + Date.now();  // Append timestamp to fileName

  // Get the file from the request
  const file = req.files?.file;  

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Upload the file to the bucket
    const blob = storage.bucket(bucketName).file(fileNameWithTimestamp);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      return res.status(500).send('Error uploading file');
    });

    blobStream.on('finish', async () => {
      // After the file is uploaded, generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileNameWithTimestamp}`;

      res.json({ publicUrl });  // Send both URLs
    });

    blobStream.end(file.data); 
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send(`Error uploading file: ${error.message}`);
  }
});

// Start the server and make it accessible on the network
app.listen(port, '0.0.0.0', () => {
 const os = require('os');

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
  return '127.0.0.1';
};

const localIp = getLocalIp();
console.log(`Server running at http://${localIp}:${port}`);
console.log(`Access it from another device at: http://${localIp}:${port}`);

});
