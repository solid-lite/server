#!/usr/bin/env node

import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  setCorsHeaders(res); // Apply CORS headers to every response

  if (req.method === 'OPTIONS') {
    handleOptions(req, res); // Handle preflight OPTIONS requests
  } else {
    next(); // Continue to other routes for non-OPTIONS requests
  }
});


const dataDirectory = path.join(__dirname, 'data');
const defaultFile = path.join(__dirname, 'profile.html');

// Enable JSON and URL Encoded parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the data directory at the root URL
app.use(express.static(dataDirectory));

// Ensure data directory exists
fs.ensureDirSync(dataDirectory);
const defaultFilePath = path.join(dataDirectory, 'index.html'); // Path for index.html in the data directory
if (!fs.existsSync(defaultFilePath)) {
  // Copy profile.html to index.html if index.html does not exist
  fs.copySync(path.join(__dirname, 'profile.html'), defaultFilePath);
}

/**
 * Returns the content type based on the given file extension.
 *
 * @param {string} ext - The file extension.
 * @returns {string} The corresponding content type.
 */
const getContentType = (ext) => {
  switch (ext) {
    // Text
    case '.txt':
      return 'text/plain'
    case '.html':
    case '.htm':
      return 'text/html'
    case '.json':
      return 'application/json'
    case '.css':
      return 'text/css'
    case '.js':
      return 'application/javascript'

    // Images
    case '.jpeg':
    case '.jpg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.bmp':
      return 'image/bmp'
    case '.svg':
      return 'image/svg+xml'
    case '.ico':
      return 'image/x-icon'
    case '.webp':
      return 'image/webp'

    // Audio
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.ogg':
      return 'audio/ogg'
    case '.m4a':
      return 'audio/mp4'
    case '.flac':
      return 'audio/flac'

    // Video
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.ogv':
      return 'video/ogg'
    case '.mov':
      return 'video/quicktime'
    case '.avi':
      return 'video/x-msvideo'

    // Other
    case '.ttl':
      return 'text/turtle'
    case '.jsonld':
      return 'application/ld+json'
    case '.md':
      return 'text/markdown'
    // this is for the my-mind mindmapping app
    case '.mymind':
      return 'application/json'

    // Default
    default:
      return 'text/html'
  }
}


function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Powered-By', 'solid-lite-0.0.1');
}

function handleOptions(req, res) {
  setCorsHeaders(res);
  res.status(204).end(); // No Content response for preflight requests
}





app.options('*', (req, res) => {
  setCorsHeaders(res);
  res.status(204).end();
});


app.use(express.text()); // Add this line to handle text/plain content type
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} Request to ${req.originalUrl}`);
  console.log('Body:', req.body);
  next();
});

// CRUD operations

// CREATE: Upload a new file
app.post('/data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);
  fs.outputFileSync(filePath, req.body.content);
  res.status(201).send('File created successfully.');
});

// HEAD: Retrieve the headers of a file
// HEAD: Retrieve the headers of a file
app.head('/data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);

  if (fs.existsSync(filePath)) {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        console.error(err);
        return res.status(500).send('An error occurred while retrieving the file info.');
      }

      // Get the file extension from the filename
      const ext = path.extname(filename);
      // Determine the content type
      const contentType = getContentType(ext);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.status(200).end();
    });
  } else {
    res.status(404).send('File not found.');
  }
});

// READ: Get a list of files or a specific file
app.get('/data/:filename?', (req, res) => {
  const { filename } = req.params;
  if (filename) {
    const filePath = path.join(dataDirectory, filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found.');
    }
  } else {
    const files = fs.readdirSync(dataDirectory);
    res.json(files);
  }
});

// CREATE or UPDATE: Upload or update a file
app.put('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);

  fs.outputFile(filePath, req.body, err => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while writing the file.');
    } else {
      res.send('File created/updated successfully.');
    }
  });
});

// DELETE: Delete a file
app.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);
  if (fs.existsSync(filePath)) {
    fs.removeSync(filePath);
    res.send('File deleted successfully.');
  } else {
    res.status(404).send('File not found.');
  }
});


// Read SSL certificate and private key
const privateKey = fs.readFileSync(path.join(__dirname, 'certs', 'privkey.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'certs', 'fullchain.pem'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

const PORT = process.env.PORT || 3111;
https.createServer(credentials, app).listen(PORT, () => {
  console.log(`Solid-Lite is running on https://localhost:${PORT}`);
});
