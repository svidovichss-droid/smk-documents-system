// API module for backend communication
class DocumentsAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL || window.location.origin;
        this.endpoints = {
            documents: `${this.baseURL}/api/documents`
        };
    }

    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Get all documents
    async getDocuments() {
        return await this.request(this.endpoints.documents);
    }

    // Get single document by ID
    async getDocument(id) {
        return await this.request(`${this.endpoints.documents}/${id}`);
    }

    // Create new document
    async createDocument(document) {
        return await this.request(this.endpoints.documents, {
            method: 'POST',
            body: JSON.stringify(document)
        });
    }

    // Update document
    async updateDocument(id, document) {
        return await this.request(`${this.endpoints.documents}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(document)
        });
    }

    // Delete document
    async deleteDocument(id) {
        return await this.request(`${this.endpoints.documents}/${id}`, {
            method: 'DELETE'
        });
    }

    // Check server connection
    async checkConnection() {
        try {
            await this.getDocuments();
            return true;
        } catch (error) {
            return false;
        }
    }
}