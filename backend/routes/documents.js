const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataPath = path.join(__dirname, '../data/documents.json');

// Helper function to read documents
const readDocuments = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to write documents
const writeDocuments = (documents) => {
  fs.writeFileSync(dataPath, JSON.stringify(documents, null, 2));
};

// GET all documents
router.get('/', (req, res) => {
  try {
    const documents = readDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET single document by ID
router.get('/:id', (req, res) => {
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
router.post('/', (req, res) => {
  try {
    const documents = readDocuments();
    const newDocument = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    documents.push(newDocument);
    writeDocuments(documents);
    
    res.status(201).json(newDocument);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT update document
router.put('/:id', (req, res) => {
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
    
    writeDocuments(documents);
    res.json(documents[documentIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE document
router.delete('/:id', (req, res) => {
  try {
    const documents = readDocuments();
    const documentIndex = documents.findIndex(doc => doc.id === req.params.id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const deletedDocument = documents.splice(documentIndex, 1)[0];
    writeDocuments(documents);
    
    res.json(deletedDocument);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;