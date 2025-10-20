const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const documentRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.use('/api/documents', documentRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend'));
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});