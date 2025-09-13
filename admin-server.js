const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { createReadStream } = require('fs');
const os = require('os');

const SERVER_UPLOAD_DIR = './server-uploads';
const ADMIN_PORT = 8080;

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

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve admin.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// List server files
app.get('/api/files/server', async (req, res) => {
    try {
        const files = await fs.readdir(SERVER_UPLOAD_DIR);
        const fileDetails = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(SERVER_UPLOAD_DIR, file);
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

// Delete server file
app.delete('/api/files/server/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(SERVER_UPLOAD_DIR, filename);
        await fs.unlink(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Update server file
app.put('/api/files/server/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { content } = req.body;
        const filePath = path.join(SERVER_UPLOAD_DIR, filename);
        await fs.writeFile(filePath, content, 'utf-8');
        res.json({ message: 'File updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
    }
});

// Download server file
app.get('/api/download/server/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(SERVER_UPLOAD_DIR, filename);
        res.download(filePath, filename);
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

app.listen(ADMIN_PORT, HOST, () => {
    console.log(`Admin Server running at http://${HOST}:${ADMIN_PORT}`);
});
