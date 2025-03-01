import { createWorker } from 'tesseract.js';

interface TransactionData {
  amount: string;
  details: string;
}

export class OcrService {
    async processImage(imageBuffer: Buffer): Promise<TransactionData[]> {
        try {
            // Create a worker with optimized settings
            const worker = await createWorker({
                logger: m => console.log(m), // Optional: log progress
            });
            
            // Load English language data
            await worker.loadLanguage('eng');
            
            // Initialize the OCR engine
            await worker.initialize('eng');
            
            // Set parameters for better accuracy with receipts/statements
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$.,:-()/ ', // Limit to relevant characters
                preserve_interword_spaces: '1',
            });
            
            // Recognize text from the image
            const { data: { text } } = await worker.recognize(imageBuffer);
            
            // Clean up
            await worker.terminate();
            
            // Parse the extracted text into transactions
            const transactions = this.parseTransactions(text);
            
            return transactions;
        } catch (error) {
            console.error('OCR processing failed:', error);
            throw new Error('Failed to process image');
        }
    }
    
    private parseTransactions(text: string): TransactionData[] {
        // Split the text into lines
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        const transactions: TransactionData[] = [];
        
        for (const line of lines) {
            // Look for dollar amount pattern ($XX.XX)
            const amountMatch = line.match(/\$(\d+\.\d{2})/);
            
            if (amountMatch) {
                const amount = amountMatch[0]; // Full match with $ sign
                
                // Get everything before the amount as details
                const details = line.substring(0, line.indexOf(amount)).trim();
                
                transactions.push({
                    amount,
                    details
                });
            }
        }
        
        return transactions;
    }
}