/**
 * Main Application Controller
 */
const App = {
    currentView: 'dashboard',
    selectedCollectionId: null,
    pendingPdfFile: null,

    init() {
        this.bindEvents();
        this.renderStats();
        this.renderRecentCollections();
        this.populateCollectionSelects();
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // "View All" button on dashboard
        document.querySelector('.text-btn[data-view="collections"]').addEventListener('click', () => {
            this.switchView('collections');
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.view === 'collections');
            });
        });

        // Collection Cards Click
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.collection-card');
            if (card) {
                this.openCollection(card.dataset.id);
            }
        });

        // Modals
        const closeBtns = document.querySelectorAll('.close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
            });
        });

        // Import PDF
        document.getElementById('btn-import-pdf').addEventListener('click', () => {
            document.getElementById('import-modal').classList.add('active');
        });

        const dropZone = document.getElementById('drop-zone');
        const pdfInput = document.getElementById('pdf-input');

        dropZone.addEventListener('click', () => pdfInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) this.handleFileSelect(e.dataTransfer.files[0]);
        });

        pdfInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleFileSelect(e.target.files[0]);
        });

        document.querySelector('.remove-file').addEventListener('click', () => {
            this.pendingPdfFile = null;
            document.getElementById('file-info').style.display = 'none';
            document.getElementById('drop-zone').style.display = 'block';
            document.getElementById('btn-start-import').disabled = true;
        });

        document.getElementById('btn-start-import').addEventListener('click', () => this.startImport());

        // Create New Collection
        document.getElementById('btn-create-collection').addEventListener('click', () => {
            const name = prompt('Enter collection name:');
            if (name) {
                Storage.addCollection(name);
                this.renderAllCollections();
                this.renderRecentCollections();
                this.populateCollectionSelects();
                this.showNotification('Collection created!');
            }
        });

        // Add Word
        document.getElementById('btn-add-word').addEventListener('click', () => {
            document.getElementById('word-modal').classList.add('active');
        });

        document.getElementById('btn-save-word').addEventListener('click', () => this.saveWord());

        // Word Table Actions
        document.getElementById('word-table-body').addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-btn');
            if (!btn) return;

            const id = btn.dataset.id;
            if (btn.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this word?')) {
                    Storage.deleteWord(id);
                    this.renderWordList(this.selectedCollectionId);
                    this.renderStats();
                }
            }
        });

        // Import Options toggle
        document.getElementById('import-target').addEventListener('change', (e) => {
            document.getElementById('new-collection-name').style.display =
                e.target.value === 'new' ? 'block' : 'none';
        });
    },

    switchView(viewId) {
        this.currentView = viewId;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${viewId}-view`).classList.add('active');

        if (viewId === 'collections') this.renderAllCollections();
        if (viewId === 'dashboard') {
            this.renderStats();
            this.renderRecentCollections();
        }
    },

    renderStats() {
        const stats = Storage.getStats();
        document.getElementById('stat-total-words').textContent = stats.totalWords;
        document.getElementById('stat-total-collections').textContent = stats.totalCollections;
        document.getElementById('stat-mastery').textContent = stats.mastery + '%';
    },

    renderRecentCollections() {
        const collections = Storage.getCollections().slice(-3).reverse();
        const container = document.getElementById('recent-collections');

        // Keep the Import PDF card
        const importCard = document.getElementById('btn-import-pdf');
        container.innerHTML = '';
        container.appendChild(importCard);

        collections.forEach(col => {
            const wordCount = Storage.getWords(col.id).length;
            const card = document.createElement('div');
            card.className = 'collection-card';
            card.dataset.id = col.id;
            card.innerHTML = `
                <span class="card-title">${col.name}</span>
                <span class="card-count"><i class="fas fa-file-alt"></i> ${wordCount} words</span>
            `;
            container.insertBefore(card, importCard);
        });
    },

    renderAllCollections() {
        const collections = Storage.getCollections();
        const container = document.getElementById('all-collections');
        container.innerHTML = '';

        collections.forEach(col => {
            const wordCount = Storage.getWords(col.id).length;
            const card = document.createElement('div');
            card.className = 'collection-card';
            card.dataset.id = col.id;
            card.innerHTML = `
                <span class="card-title">${col.name}</span>
                <span class="card-count"><i class="fas fa-file-alt"></i> ${wordCount} words</span>
            `;
            container.appendChild(card);
        });
    },

    openCollection(id) {
        this.selectedCollectionId = id;
        const col = Storage.getCollections().find(c => c.id === id);
        if (col) {
            document.getElementById('current-collection-name').textContent = col.name;
            this.renderWordList(id);
            this.switchView('wordlist');
        }
    },

    renderWordList(collectionId) {
        const words = Storage.getWords(collectionId);
        const container = document.getElementById('word-table-body');
        container.innerHTML = '';

        words.forEach(w => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${w.word}</strong></td>
                <td><span class="ipa-text">${w.ipa || '-'}</span></td>
                <td>${w.definition || '-'}</td>
                <td>${w.translation || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="icon-btn delete" data-id="${w.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            container.appendChild(tr);
        });
    },

    handleFileSelect(file) {
        this.pendingPdfFile = file;
        document.getElementById('filename').textContent = file.name;
        document.getElementById('file-info').style.display = 'flex';
        document.getElementById('drop-zone').style.display = 'none';
        document.getElementById('btn-start-import').disabled = false;

        // Auto-fill collection name from file
        const nameInput = document.getElementById('new-collection-name');
        if (!nameInput.value) {
            nameInput.value = file.name.replace('.pdf', '');
        }
    },

    async startImport() {
        const btn = document.getElementById('btn-start-import');
        const progressSection = document.getElementById('import-progress');
        const progressBar = document.querySelector('.progress-bar');
        const progressStatus = document.querySelector('.progress-status');
        const targetSelect = document.getElementById('import-target');
        const newColName = document.getElementById('new-collection-name');

        btn.disabled = true;
        progressSection.style.display = 'block';

        try {
            const entries = await PDFParser.extractEntries(this.pendingPdfFile, (status, percent) => {
                progressBar.style.width = `${percent}%`;
                progressStatus.textContent = status;
            });

            let collectionId = targetSelect.value;
            if (collectionId === 'new') {
                const col = Storage.addCollection(newColName.value || 'New Collection');
                collectionId = col.id;
            }

            // Save entries
            entries.forEach(entry => {
                Storage.addWord({
                    collectionId: collectionId,
                    ...entry
                });
            });

            this.showNotification(`Successfully imported ${entries.length} words!`);

            // Cleanup and close
            setTimeout(() => {
                document.getElementById('import-modal').classList.remove('active');
                progressSection.style.display = 'none';
                progressBar.style.width = '0%';
                this.pendingPdfFile = null;
                document.getElementById('file-info').style.display = 'none';
                document.getElementById('drop-zone').style.display = 'block';
                this.renderStats();
                this.renderRecentCollections();
                this.populateCollectionSelects();
                this.openCollection(collectionId);
            }, 500);

        } catch (e) {
            alert(e.message);
            btn.disabled = false;
        }
    },

    saveWord() {
        if (!this.selectedCollectionId) return;

        const word = document.getElementById('input-word').value;
        const ipa = document.getElementById('input-ipa').value;
        const definition = document.getElementById('input-definition').value;
        const translation = document.getElementById('input-translation').value;

        if (!word) {
            alert('Word is required!');
            return;
        }

        Storage.addWord({
            collectionId: this.selectedCollectionId,
            word, ipa, definition, translation
        });

        this.renderWordList(this.selectedCollectionId);
        this.renderStats();
        document.getElementById('word-modal').classList.remove('active');
        this.showNotification('Word saved!');

        // Clear inputs
        ['input-word', 'input-ipa', 'input-definition', 'input-translation'].forEach(id => {
            document.getElementById(id).value = '';
        });
    },

    populateCollectionSelects() {
        const collections = Storage.getCollections();
        const select = document.getElementById('import-target');

        // Remove old options except "new"
        while (select.options.length > 1) {
            select.remove(1);
        }

        collections.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col.id;
            opt.textContent = col.name;
            select.appendChild(opt);
        });
    },

    showNotification(msg) {
        const toast = document.getElementById('notification-toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());
