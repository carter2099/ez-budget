import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppError } from './types/errors';
import { OcrService } from './services/OcrService';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'image/*', limit: '10mb' }));

// Start background jobs
//initJob();

const ocrService = new OcrService();

// POST
app.post('/api/myPost', async (_req: Request, res: Response) => {
    try {
        const result = { success: true, message: "Post successful" };
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Post failed' 
        });
    }
});

// GET
app.get('/api/myGet', async (_req: Request, res: Response) => {
    try {
        res.json({ message: "Hello World!" });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred' 
        });
    }
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Replace multer with direct buffer handling
app.post('/api/ocr', async (req: Request, res: Response) => {
    try {
        if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
            throw new AppError('No image data provided', 400);
        }

        const transactions = await ocrService.processImage(req.body);
        res.json({ 
            success: true, 
            transactions,
            rawText: transactions.map(t => `${t.details} ${t.amount}`).join('\n')
        });
    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to process image' 
        });
    }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message
        });
    } else {
        res.status(500).json({
            message: 'An unexpected error occurred'
        });
    }
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Cleaning up...');
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});