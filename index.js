#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
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


// CRUD operations

// CREATE: Upload a new file
app.post('/data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);
  fs.outputFileSync(filePath, req.body.content);
  res.status(201).send('File created successfully.');
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

// UPDATE: Update an existing file
app.put('/data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);
  if (fs.existsSync(filePath)) {
    fs.outputFileSync(filePath, req.body.content);
    res.send('File updated successfully.');
  } else {
    res.status(404).send('File not found.');
  }
});

// DELETE: Delete a file
app.delete('/data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDirectory, filename);
  if (fs.existsSync(filePath)) {
    fs.removeSync(filePath);
    res.send('File deleted successfully.');
  } else {
    res.status(404).send('File not found.');
  }
});

// Start the server
const PORT = process.env.PORT || 3111;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
