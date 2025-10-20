const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data file path
const dataPath = path.join(__dirname, 'data', 'documents.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dataPath))) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
}

// Helper function to read documents
const readDocuments = () => {
  try {
    if (!fs.existsSync(dataPath)) {
      // Create initial data file with sample data
      const initialData = [
        {
          "id": "1",
          "number": "1",
          "caseNumber": "6",
          "name": "Политика в области качества и пищевой безопасности АО «ПРОГРЕСС»",
          "code": "",
          "date": "04.08.2025",
          "scope": "Все подразделения АО \"ПРОГРЕСС\", г. Липецк",
          "link": "Ссылка",
          "createdAt": new Date().toISOString(),
          "updatedAt": new Date().toISOString()
        }
      ];
      writeDocuments(initialData);
      return initialData;
    }
    
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading documents:', error);
    return [];
  }
};

// Helper function to write documents
const writeDocuments = (documents) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(documents, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing documents:', error);
    return false;
  }
};

// API Routes

// GET all documents
app.get('/api/documents', (req, res) => {
  try {
    const documents = readDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET single document by ID
app.get('/api/documents/:id', (req, res) => {
  try {
    const documents = readDocuments();
    const document = documents.find(doc => doc.id === req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST create new document
app.post('/api/documents', (req, res) => {
  try {
    const documents = readDocuments();
    const newDocument = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    documents.push(newDocument);
    const success = writeDocuments(documents);
    
    if (success) {
      res.status(201).json(newDocument);
    } else {
      res.status(500).json({ error: 'Failed to save document' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT update document
app.put('/api/documents/:id', (req, res) => {
  try {
    const documents = readDocuments();
    const documentIndex = documents.findIndex(doc => doc.id === req.params.id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    documents[documentIndex] = {
      ...documents[documentIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const success = writeDocuments(documents);
    
    if (success) {
      res.json(documents[documentIndex]);
    } else {
      res.status(500).json({ error: 'Failed to update document' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE document
app.delete('/api/documents/:id', (req, res) => {
  try {
    const documents = readDocuments();
    const documentIndex = documents.findIndex(doc => doc.id === req.params.id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const deletedDocument = documents.splice(documentIndex, 1)[0];
    const success = writeDocuments(documents);
    
    if (success) {
      res.json(deletedDocument);
    } else {
      res.status(500).json({ error: 'Failed to delete document' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});