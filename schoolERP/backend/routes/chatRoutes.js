import express from 'express';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinaryConfig.js';
import fs from 'fs';

const router = express.Router();

// POST /api/chat/upload
// Upload a file to Cloudinary for chat
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const roomId = req.body.roomId || 'general';

        // Determine resource type based on file mimetype
        const isImage = req.file.mimetype.startsWith('image/');
        const resourceType = isImage ? 'image' : 'raw';

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: `chat_files/${roomId}`,
            resource_type: resourceType,
            public_id: `${Date.now()}_${req.file.originalname.replace(/\.[^/.]+$/, '')}`,
        });

        // Clean up the local temp file
        fs.unlink(req.file.path, (err) => {
            if (err) console.warn('Could not delete temp file:', err);
        });

        res.json({
            url: result.secure_url,
            fileName: req.file.originalname,
            fileType: req.file.mimetype
        });

    } catch (error) {
        console.error('Chat upload error:', error);
        // Clean up temp file on error too
        if (req.file?.path) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ message: error.message || 'Upload failed' });
    }
});

export default router;
