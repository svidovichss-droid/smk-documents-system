// Main application module
class DocumentsApp {
    constructor() {
        this.api = new DocumentsAPI();
        this.documentManager = new DocumentManager(this.api);
        this.isOnline = false;
        
        // DOM elements
        this.elements = {
            tableBody: document.querySelector('#documentsTable tbody'),
            syncStatus: document.getElementById('syncStatus'),
            serverInfo: document.getElementById('serverInfo'),
            addRowBtn: document.getElementById('addRowBtn'),
            exportBtn: document.getElementById('exportBtn'),
            importBtn: document.getElementById('importBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            editModal: document.getElementById('editModal'),
            editForm: document.getElementById('editForm'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            cancelEditBtn: document.getElementById('cancelEditBtn'),
            fileImport: document.getElementById('fileImport')
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkConnection();
        await this.loadDocuments();
    }

    setupEventListeners() {
        // Button events
        this.elements.addRowBtn.addEventListener('click', () => this.openAddModal());
        this.elements.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.elements.importBtn.addEventListener('click', () => this.elements.fileImport.click());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshData());
        
        // Modal events
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.elements.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.elements.editModal.addEventListener('click', (e) => {
            if (e.target === this.elements.editModal) this.closeModal();
        });
        
        // Form submission
        this.elements.editForm.addEventListener('submit', (e) => this.saveDocument(e));
        
        // File import
        this.elements.fileImport.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromCSV(e.target.files[0]);
                e.target.value = '';
            }
        });
    }

    async checkConnection() {
        this.isOnline = await this.api.checkConnection();
        this.updateConnectionStatus();
        return this.isOnline;
    }

    updateConnectionStatus() {
        const statusElement = this.elements.syncStatus;
        const serverInfoElement = this.elements.serverInfo;
        
        if (this.isOnline) {
            statusElement.textContent = 'Синхронизировано с сервером';
            statusElement.className = 'sync-status synced';
            serverInfoElement.textContent = `Сервер: ${this.api.baseURL}`;
        } else {
            statusElement.textContent = 'Оффлайн режим';
            statusElement.className = 'sync-status error';
            serverInfoElement.textContent = 'Нет соединения с сервером';
        }
    }

    async loadDocuments() {
        try {
            this.setLoading(true);
            await this.documentManager.loadDocuments();
            this.renderTable();
        } catch (error) {
            this.showError('Не удалось загрузить документы');
        } finally {
            this.setLoading(false);
        }
    }

    renderTable(documents = null) {
        const data = documents || this.documentManager.documents;
        this.elements.tableBody.innerHTML = '';

        data.forEach((doc, index) => {
            const tr = document.createElement('tr');
            
            // Check if link is a URL
            const isLink = doc.link && (doc.link.startsWith('http://') || doc.link.startsWith('https://'));
            const linkDisplay = isLink ? 
                `<a href="${doc.link}" target="_blank">Ссылка</a>` : 
                doc.link;
            
            tr.innerHTML = `
                <td class="number">${doc.number}</td>
                <td class="case-number">${doc.caseNumber}</td>
                <td class="name">${doc.name}</td>
                <td class="code">${doc.code}</td>
                <td class="date">${doc.date}</td>
                <td class="scope">${doc.scope}</td>
                <td class="link">${linkDisplay}</td>
                <td class="actions">
                    <button class="edit-btn" data-id="${doc.id}">Редактировать</button>
                    <button class="delete-btn" data-id="${doc.id}">Удалить</button>
                </td>
            `;
            this.elements.tableBody.appendChild(tr);
        });

        // Add event listeners to action buttons
        this.elements.tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.openEditModal(id);
            });
        });

        this.elements.tableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.deleteDocument(id);
            });
        });
    }

    openAddModal() {
        this.openModal({
            id: '',
            number: (this.documentManager.documents.length + 1).toString(),
            caseNumber: '',
            name: '',
            code: '',
            date: '',
            scope: '',
            link: ''
        });
    }

    openEditModal(id) {
        const document = this.documentManager.documents.find(doc => doc.id === id);
        if (document) {
            this.openModal(document);
        }
    }

    openModal(document) {
        document.getElementById('editId').value = document.id;
        document.getElementById('editNumber').value = document.number;
        document.getElementById('editCaseNumber').value = document.caseNumber;
        document.getElementById('editName').value = document.name;
        document.getElementById('editCode').value = document.code;
        document.getElementById('editDate').value = document.date;
        document.getElementById('editScope').value = document.scope;
        document.getElementById('editLink').value = document.link;
        
        this.elements.editModal.style.display = 'flex';
    }

    closeModal() {
        this.elements.editModal.style.display = 'none';
        this.elements.editForm.reset();
    }

    async saveDocument(e) {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const documentData = {
            number: document.getElementById('editNumber').value,
            caseNumber: document.getElementById('editCaseNumber').value,
            name: document.getElementById('editName').value,
            code: document.getElementById('editCode').value,
            date: document.getElementById('editDate').value,
            scope: document.getElementById('editScope').value,
            link: document.getElementById('editLink').value
        };

        try {
            this.setLoading(true);
            
            if (id) {
                // Update existing document
                await this.documentManager.updateDocument(id, documentData);
            } else {
                // Create new document
                await this.documentManager.createDocument(documentData);
            }
            
            this.renderTable();
            this.closeModal();
        } catch (error) {
            this.showError('Не удалось сохранить документ');
        } finally {
            this.setLoading(false);
        }
    }

    async deleteDocument(id) {
        if (!confirm('Вы уверены, что хотите удалить этот документ?')) {
            return;
        }

        try {
            this.setLoading(true);
            await this.documentManager.deleteDocument(id);
            this.renderTable();
        } catch (error) {
            this.showError('Не удалось удалить документ');
        } finally {
            this.setLoading(false);
        }
    }

    exportToCSV() {
        const csvUrl = this.documentManager.exportToCSV();
        const link = document.createElement("a");
        link.setAttribute("href", csvUrl);
        link.setAttribute("download", "documents_smk_smbpp.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    importFromCSV(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const importedDocuments = this.documentManager.importFromCSV(content);
                
                if (importedDocuments.length === 0) {
                    this.showError('Не удалось найти данные для импорта');
                    return;
                }
                
                if (confirm(`Найдено ${importedDocuments.length} записей. Импортировать?`)) {
                    this.setLoading(true);
                    
                    // Import each document
                    for (const doc of importedDocuments) {
                        await this.documentManager.createDocument(doc);
                    }
                    
                    this.renderTable();
                    this.setLoading(false);
                }
            } catch (error) {
                this.showError('Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
    }

    async refreshData() {
        await this.checkConnection();
        await this.loadDocuments();
    }

    setLoading(loading) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = loading;
        });
        
        if (loading) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentsApp();
});