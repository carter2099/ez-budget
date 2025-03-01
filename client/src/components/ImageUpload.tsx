import { useState } from 'react';
import { config } from '../config';

interface Transaction {
  amount: string;
  details: string;
}

export function ImageUpload() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [rawText, setRawText] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            // Read file as ArrayBuffer
            const buffer = await file.arrayBuffer();
            
            const response = await fetch(`${config.API_URL}/api/ocr`, {
                method: 'POST',
                headers: {
                    'Content-Type': file.type,
                },
                body: buffer,
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }

            setTransactions(data.transactions);
            setRawText(data.rawText);
        } catch (err) {
            setError('Failed to process image');
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="image-upload">
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLoading}
            />
            
            {isLoading && <div>Processing image...</div>}
            {error && <div className="error">{error}</div>}
            
            {transactions.length > 0 && (
                <div className="ocr-result">
                    <h3>Extracted Transactions:</h3>
                    
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Details</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction, index) => (
                                <tr key={index}>
                                    <td>{transaction.details}</td>
                                    <td className="amount">{transaction.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <h4>Raw Text:</h4>
                    <pre>{rawText}</pre>
                </div>
            )}
        </div>
    );
} 