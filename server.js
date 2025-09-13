
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const unzipper = require('unzipper');
const { createReadStream } = require('fs');
const os = require('os');

const app = express();
const PORT = 80;

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        if (/wi-?fi|wireless/i.test(name)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}
const HOST = getLocalIp();

const UPLOAD_DIR = './uploads';
const SERVER_UPLOAD_DIR = './server-uploads';
const CLIENT_UPLOAD_DIR = './client-uploads';

async function ensureDirectories() {
    const dirs = [UPLOAD_DIR, SERVER_UPLOAD_DIR, CLIENT_UPLOAD_DIR];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Error creating directory ${dir}:`, error);
        }
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.body.uploadType || 'client';
        const dir = uploadType === 'server' ? SERVER_UPLOAD_DIR : CLIENT_UPLOAD_DIR;
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});

app.use(express.static('public'));
app.use(express.json());
// Preview readable files in browser
app.get('/api/preview/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        const dir = type === 'server' ? SERVER_UPLOAD_DIR : CLIENT_UPLOAD_DIR;
        const filePath = path.join(dir, filename);
        const ext = path.extname(filename).toLowerCase();

        // List of readable formats
        const readableTypes = ['.txt', '.pdf', '.doc', '.docx', '.py', '.md', '.json', '.csv', '.log'];
        if (!readableTypes.includes(ext)) {
            return res.status(415).send('Preview not supported for this file type.');
        }

        if (ext === '.py' || ext === '.txt' || ext === '.md' || ext === '.json' || ext === '.csv' || ext === '.log' || ext === '.docx' || ext === '.doc') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.sendFile(path.resolve(filePath));
        } else if (ext === '.pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            return res.sendFile(path.resolve(filePath));
        } else if (ext === '.doc' || ext === '.docx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            return res.sendFile(path.resolve(filePath));
        } else {
            return res.download(filePath, filename);
        }
    } catch (error) {
        res.status(500).json({ error: 'Preview failed' });
    }
});



// API Routes

// Get file list from a directory
app.get('/api/files/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const dir = type === 'server' ? SERVER_UPLOAD_DIR : CLIENT_UPLOAD_DIR;
        
        const files = await fs.readdir(dir);
        const fileDetails = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory()
                };
            })
        );
        
        res.json(fileDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read directory' });
    }
});

// Upload files
app.post('/api/upload', upload.array('files'), (req, res) => {
    try {
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
        }));
        
        res.json({ 
            message: 'Files uploaded successfully', 
            files: uploadedFiles 
        });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Download individual file
app.get('/api/download/:type/:filename', (req, res) => {
    try {
        const { type, filename } = req.params;
        const dir = type === 'server' ? SERVER_UPLOAD_DIR : CLIENT_UPLOAD_DIR;
        const filePath = path.join(dir, filename);
        
        // Set proper content type and disposition
        const ext = path.extname(filename).toLowerCase();
        const contentType = {
            '.txt': 'text/plain',
            '.py': 'text/plain',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        createReadStream(filePath).pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

// Download all files as zip
app.get('/api/download-all/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const dir = type === 'server' ? SERVER_UPLOAD_DIR : CLIENT_UPLOAD_DIR;
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-files.zip"`);
        
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        
        archive.directory(dir, false);
        await archive.finalize();
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to create zip' });
    }
});

// Delete file
app.delete('/api/files/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        if (type === 'server') {
            return res.status(403).json({ error: 'Server uploads cannot be deleted' });
        }
        const dir = type === 'server' ? SERVER_UPLOAD_DIR :CLIENT_UPLOAD_DIR;
        const filePath = path.join(dir, filename);
        
        await fs.unlink(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Enhanced view endpoint with content response
app.get('/api/view/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        const dir = type === 'server' ? SERVER_UPLOAD_DIR : CLIENT_UPLOAD_DIR;
        const filePath = path.join(dir, filename);
        
        const ext = path.extname(filename).toLowerCase();
        const isTextFile = ['.txt', '.py'].includes(ext);
        
        if (isTextFile) {
            const content = await fs.readFile(filePath, 'utf-8');
            res.json({
                content: content,
                fileName: filename,
                fileType: ext.replace('.', '')
            });
        } else {
            const contentType = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }[ext] || 'application/octet-stream';
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to view file' });
    }
});

// Start server
ensureDirectories().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`File Manager Server running at http://${HOST}`); //:${PORT}
    });
});

module.exports = app;