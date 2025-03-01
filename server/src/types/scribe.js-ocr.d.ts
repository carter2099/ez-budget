declare module 'scribe.js-ocr' {
    const scribe: {
        extractText: (images: string[]) => Promise<string[]>;
    };
    
    export default scribe;
} 