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

// GET /api/chat/students/:classSection
// Fetch students by class-section for adding to chat
router.get('/students/:classSection', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const parts = req.params.classSection.split('-');
        const section = parts.length > 1 ? parts.pop() : null;
        const classNum = parts.join('-');
        const classVal = isNaN(Number(classNum)) ? classNum : Number(classNum);

        let query = { "academic.current_class": classVal };
        if (section && section !== "undefined" && section !== "null") {
            query["academic.section"] = section;
        }

        const students = await db.collection("student").find(query).toArray();

        const mapped = students.map(s => ({
            id: s.admission_no || s._id.toString(),
            name: s.personal_details
                ? `${s.personal_details.first_name || ''} ${s.personal_details.last_name || ''}`.trim()
                : (s.name || 'Student'),
            role: 'student',
            class: String(s.academic?.current_class || classNum),
            section: s.academic?.section || section
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching students for chat:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/chat/teachers
// List all teachers for adding to chat
router.get('/teachers', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const teachers = await db.collection("teachers").find({}).toArray();

        const mapped = teachers.map(t => ({
            id: t.teacher_id || t._id.toString(),
            name: t.personal_details?.name
                || `${t.personal_details?.first_name || ''} ${t.personal_details?.last_name || ''}`.trim()
                || t.name || 'Teacher',
            role: 'teacher',
            subject: t.professional_details?.subject || t.subject || ''
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching teachers for chat:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
