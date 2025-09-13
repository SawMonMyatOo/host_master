# File Manager Web Application

A full-stack file manager application that allows server-side file uploads and client-side file sharing with download capabilities. Built with Node.js, Express, and vanilla JavaScript.

## Features

- **Server Upload Area**: Admin can upload files to a dedicated server directory
- **Client Upload Area**: Users can upload files to a shared client directory
- **File Management**: View, download, and delete files
- **Bulk Operations**: Download all files as a ZIP archive
- **Drag & Drop**: Intuitive file upload interface
- **Responsive Design**: Works on desktop and mobile devices
- **Docker Support**: Easy deployment with Docker containers

## Quick Start with Docker

### Option 1: Docker Compose (Recommended)

1. Clone or download all the files to a directory
2. Make sure you have Docker and Docker Compose installed
3. Run the application:

```bash
# Build and start the services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

4. Access the application at `http://localhost` (with nginx) or `http://localhost:3000` (direct access)

### Option 2: Docker Build

```bash
# Build the Docker image
docker build -t file-manager .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data/server-uploads:/app/server-uploads \
  -v $(pwd)/data/client-uploads:/app/client-uploads \
  --name file-manager \
  file-manager

# Access at http://localhost:3000
```

## Manual Setup (Development)

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Create project directory and copy files:

```bash
mkdir file-manager-app
cd file-manager-app
# Copy all the provided files to this directory
```

2. Create the HTML client interface:

```bash
# Create public directory
mkdir public
# Save the HTML content as public/index.html
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
# or for production
npm start
```

5. Access the application at `http://localhost:3000`

## File Structure

```
host_master/
├── server.js                 # Main Express server
├── package.json              # Node.js dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
├── nginx.conf              # Nginx reverse proxy config
├── .dockerignore           # Docker ignore rules
├── public/
│   └── index.html          # Client interface
|   └── admin.html          # Admin Interface
├── server-uploads/         # Server uploaded files
├── client-uploads/         # Client uploaded files
└── data/                   # Persistent Docker volumes
    ├── server-uploads/
    └── client-uploads/
```

## API Endpoints

### File Management
- `GET /api/files/:type` - Get file list (type: 'server' or 'client')
- `POST /api/upload` - Upload files
- `GET /api/download/:type/:filename` - Download specific file
- `GET /api/download-all/:type` - Download all files as ZIP
- `DELETE /api/files/:type/:filename` - Delete file

### Parameters
- `:type` - Either 'server' or 'client' 
- `:filename` - URL-encoded filename

## Usage

### Server Upload
1. Go to "Upload Files" tab
2. Select "Server Upload" option
3. Drag & drop files or click to select
4. Click "Upload Files"
5. Files will appear in "Server Files" tab

### Client Upload  
1. Go to "Upload Files" tab
2. Select "Client Upload" option (default)
3. Drag & drop files or click to select
4. Click "Upload Files" 
5. Files will appear in "Client Files" tab

### File Operations
- **View Files**: Switch between "Server Files" and "Client Files" tabs
- **Download**: Click download button next to any file
- **Download All**: Click "Download All" to get ZIP of all files
- **Delete**: Click delete button (with confirmation)
- **Refresh**: Click refresh button to update file list

## Configuration

### Environment Variables
- `PORT` - Server port (default: 80)
- `NODE_ENV` - Environment mode (development/production)

### File Limits
- Maximum file size: 100MB per file
- No limit on number of files
- Supports all file types

### Security Features
- Input validation and sanitization
- File type verification
- XSS protection headers
- CSRF protection
- Rate limiting ready (can be added)

## Deployment

### Production Deployment

1. **With Docker Compose** (Recommended):
```bash
docker-compose up -d
```

2. **With Docker**:
```bash
docker build -t host_master .
docker run -d -p 80:80-v /host/data:/app/data file-manager
```

3. **Traditional Deployment**:
```bash
npm install --production
NODE_ENV=production npm start
```

### Reverse Proxy Setup

The included nginx configuration provides:
- Load balancing
- Static file serving
- Security headers
- Gzip compression
- Extended timeouts for large files

## Monitoring & Maintenance

### Health Checks
The Docker setup includes health checks:
- Container health monitoring
- Automatic restart on failure
- Service dependency management

### Logs
```bash
# Docker Compose logs
docker-compose logs -f

# Container logs
docker logs file-manager
```

### Backup
Important directories to backup:
- `./data/server-uploads/` - Server files
- `./data/client-uploads/` - Client files

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Change port in docker-compose.yml or use different port
   docker-compose down
   # Edit docker-compose.yml port mapping
   docker-compose up -d
   ```

2. **Permission denied**:
   ```bash
   # Fix file permissions
   sudo chown -R $(whoami):$(whoami) ./data/
   ```

3. **Upload failing**:
   - Check file size (max 100MB)
   - Verify disk space
   - Check Docker volume mounts

4. **Cannot access application**:
   - Verify Docker containers are running: `docker-compose ps`
   - Check ports are not blocked by firewall
   - Verify nginx configuration if using reverse proxy

### Development

For development with hot reload:
```bash
npm install -g nodemon
npm run dev
```

## License

MIT License - Feel free to use and modify as needed.

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs
3. Verify file permissions
4. Check network connectivity
