import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use((req, res, next) => {
  // Enable CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,PUT,DELETE,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.send('Welcome to Solid-Lite!');
});

app.get('/resource/:id', (req, res) => {
  const { id } = req.params;
  // Implement logic to retrieve the resource by ID
  res.json({
    '@context': 'http://example.org/context/v1',
    '@id': `http://example.org/resource/${id}`,
    // other fields...
  });
});

app.put('/resource/:id', (req, res) => {
  const { id } = req.params;
  const { body } = req;
  // Implement logic to update or create the resource with the given ID
  res.json({ message: 'Resource updated successfully!' });
});

app.delete('/resource/:id', (req, res) => {
  const { id } = req.params;
  // Implement logic to delete the resource with the given ID
  res.json({ message: 'Resource deleted successfully!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
