// Document management module
class DocumentManager {
    constructor(api) {
        this.api = api;
        this.documents = [];
        this.currentSort = { field: null, direction: 'asc' };
    }

    // Load documents from server
    async loadDocuments() {
        try {
            this.documents = await this.api.getDocuments();
            return this.documents;
        } catch (error) {
            console.error('Failed to load documents:', error);
            throw error;
        }
    }

    // Create new document
    async createDocument(documentData) {
        try {
            const newDocument = await this.api.createDocument(documentData);
            this.documents.push(newDocument);
            return newDocument;
        } catch (error) {
            console.error('Failed to create document:', error);
            throw error;
        }
    }

    // Update document
    async updateDocument(id, documentData) {
        try {
            const updatedDocument = await this.api.updateDocument(id, documentData);
            const index = this.documents.findIndex(doc => doc.id === id);
            if (index !== -1) {
                this.documents[index] = updatedDocument;
            }
            return updatedDocument;
        } catch (error) {
            console.error('Failed to update document:', error);
            throw error;
        }
    }

    // Delete document
    async deleteDocument(id) {
        try {
            await this.api.deleteDocument(id);
            this.documents = this.documents.filter(doc => doc.id !== id);
            return true;
        } catch (error) {
            console.error('Failed to delete document:', error);
            throw error;
        }
    }

    // Sort documents
    sortDocuments(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }

        this.documents.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            // Handle empty values
            if (!aValue) aValue = '';
            if (!bValue) bValue = '';

            // Compare values
            if (aValue < bValue) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return this.documents;
    }

    // Search documents
    searchDocuments(query) {
        if (!query) return this.documents;

        const lowerQuery = query.toLowerCase();
        return this.documents.filter(doc => 
            doc.name.toLowerCase().includes(lowerQuery) ||
            doc.scope.toLowerCase().includes(lowerQuery) ||
            doc.code.toLowerCase().includes(lowerQuery)
        );
    }

    // Export to CSV
    exportToCSV() {
        const headers = ['№ п/п', '№ дела', 'Наименование', 'Шифр', 'Дата утверждения', 'Область действия', 'Ссылка'];
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        csvContent += headers.join(";") + "\n";
        
        // Add data
        this.documents.forEach(doc => {
            const rowData = [
                doc.number,
                doc.caseNumber,
                `"${doc.name.replace(/"/g, '""')}"`,
                doc.code,
                doc.date,
                `"${doc.scope.replace(/"/g, '""')}"`,
                doc.link
            ];
            csvContent += rowData.join(";") + "\n";
        });
        
        return encodeURI(csvContent);
    }

    // Import from CSV
    importFromCSV(csvText) {
        const lines = csvText.split('\n');
        const importedDocuments = [];
        
        // Skip header and process data lines
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const cells = this.parseCSVLine(lines[i]);
            if (cells.length >= 7) {
                importedDocuments.push({
                    number: cells[0],
                    caseNumber: cells[1],
                    name: cells[2].replace(/""/g, '"'),
                    code: cells[3],
                    date: cells[4],
                    scope: cells[5].replace(/""/g, '"'),
                    link: cells[6]
                });
            }
        }
        
        return importedDocuments;
    }

    // Parse CSV line with quotes handling
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ';' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
}