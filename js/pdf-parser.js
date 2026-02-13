const PDFParser = {
    async extractEntries(file, onProgress) {
        onProgress('Reading PDF file...', 10);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';

                const progress = 10 + Math.round((i / pdf.numPages) * 70);
                onProgress(`Reading page ${i}/${pdf.numPages}...`, progress);
            }

            onProgress('Parsing content...', 85);

            // Simplified Cambridge Regex from artifacts
            const cambridgeRegex = /\b([a-zA-Z][\w\-']+)\s+\/([^\/]+)\/\s*([^\n]+)/g;
            const matches = [...fullText.matchAll(cambridgeRegex)];

            const entries = matches.map(match => ({
                word: match[1].trim(),
                ipa: `/${match[2].trim()}/`,
                definition: match[3].trim(),
                translation: '' // Placeholder for now
            }));

            // If no Cambridge matches, try a more generic word: definition format
            if (entries.length === 0) {
                const genericRegex = /^([a-zA-Z][\w\-']+)\s*:\s*(.+)$/gm;
                const genericMatches = [...fullText.matchAll(genericRegex)];
                entries.push(...genericMatches.map(match => ({
                    word: match[1].trim(),
                    ipa: '',
                    definition: match[2].trim(),
                    translation: ''
                })));
            }

            onProgress(`Found ${entries.length} entries. Finishing up...`, 95);
            return entries;

        } catch (e) {
            console.error('PDF Extraction Error:', e);
            throw new Error('Failed to parse PDF. Please ensure it is a text-based PDF.');
        }
    },

    // Mock translation since we are "api-siz"
    // In a real scenario, this could use a local dictionary or ask the user
    suggestTranslation(word) {
        return `[Tercüme: ${word}]`;
    }
};

window.PDFParser = PDFParser;
