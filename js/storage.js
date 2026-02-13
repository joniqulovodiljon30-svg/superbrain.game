const Storage = {
    KEYS: {
        COLLECTIONS: 'vocab_collections',
        WORDS: 'vocab_words',
        SETTINGS: 'vocab_settings'
    },

    // Initialize with demo data if empty
    init() {
        if (!localStorage.getItem(this.KEYS.COLLECTIONS)) {
            const demoCollections = [
                { id: 'col-1', name: 'Essential English', createdAt: Date.now() },
                { id: 'col-2', name: 'Advanced IELTS', createdAt: Date.now() }
            ];
            const demoWords = [
                { id: 'w-1', collectionId: 'col-1', word: 'Resilience', ipa: '/rɪˈzɪl.jəns/', definition: 'The capacity to recover quickly from difficulties.', translation: 'Bardoshlilik', createdAt: Date.now() },
                { id: 'w-2', collectionId: 'col-1', word: 'Serendipity', ipa: '/ˌser.ənˈdɪp.ə.ti/', definition: 'The occurrence of events by chance in a happy way.', translation: 'Baxtli tasodif', createdAt: Date.now() },
                { id: 'w-3', collectionId: 'col-2', word: 'Ambiguous', ipa: '/æmˈbɪɡ.ju.əs/', definition: 'Open to more than one interpretation.', translation: 'Mavhum', createdAt: Date.now() }
            ];
            this.saveData(this.KEYS.COLLECTIONS, demoCollections);
            this.saveData(this.KEYS.WORDS, demoWords);
        }
    },

    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error reading ${key} from storage:`, e);
            return [];
        }
    },

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key} to storage:`, e);
        }
    },

    // Collections
    getCollections() {
        return this.getData(this.KEYS.COLLECTIONS);
    },

    addCollection(name) {
        const collections = this.getCollections();
        const newCollection = {
            id: 'col-' + Date.now(),
            name: name,
            createdAt: Date.now()
        };
        collections.push(newCollection);
        this.saveData(this.KEYS.COLLECTIONS, collections);
        return newCollection;
    },

    // Words
    getWords(collectionId = null) {
        const words = this.getData(this.KEYS.WORDS);
        if (collectionId) {
            return words.filter(w => w.collectionId === collectionId);
        }
        return words;
    },

    addWord(wordData) {
        const words = this.getWords();
        const newWord = {
            id: 'w-' + Date.now(),
            ...wordData,
            createdAt: Date.now()
        };
        words.push(newWord);
        this.saveData(this.KEYS.WORDS, words);
        return newWord;
    },

    deleteWord(id) {
        const words = this.getWords();
        const filtered = words.filter(w => w.id !== id);
        this.saveData(this.KEYS.WORDS, filtered);
    },

    getStats() {
        const words = this.getWords();
        const collections = this.getCollections();
        return {
            totalWords: words.length,
            totalCollections: collections.length,
            mastery: words.length > 0 ? Math.min(Math.round((words.length / 50) * 100), 100) : 0
        };
    }
};

Storage.init();
window.Storage = Storage;
