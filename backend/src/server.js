import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import crypto from 'crypto';
import { initialShares, initialAuditLogs } from './data.js';

const app = express();
const PORT = process.env.PORT || 5008;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

let shares = [...initialShares];
let auditLogs = [...initialAuditLogs];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FileBridge Zero-Knowledge Ephemeral Transfer',
    encryption: 'AES-256-GCM',
    version: '1.0.0'
  });
});

// Stats overview
app.get('/api/v1/stats', (req, res) => {
  const activeCount = shares.filter(s => s.status === 'ACTIVE').length;
  const totalDownloads = shares.reduce((acc, s) => acc + (s.downloadCount || 0), 0);
  const burnedCount = shares.filter(s => s.status === 'BURNED').length;

  res.json({
    totalShares: shares.length,
    activeShares: activeCount,
    totalDownloads: totalDownloads,
    burnedShares: burnedCount,
    auditEventsCount: auditLogs.length
  });
});

// List shares
app.get('/api/v1/shares', (req, res) => {
  res.json(shares);
});

// Get single share metadata
app.get('/api/v1/shares/:id', (req, res) => {
  const share = shares.find(s => s.id === req.params.id);
  if (!share) return res.status(404).json({ error: 'Share link not found or expired' });
  res.json(share);
});

// Create new secure share
app.post('/api/v1/shares', (req, res) => {
  const { filename, sizeMb, maxDownloads, burnAfterReading, hasPassword, expirationHours, sender } = req.body;
  
  const id = `FB-${Math.floor(100 + Math.random() * 899)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (Number(expirationHours) || 24) * 60 * 60 * 1000).toISOString();
  const sha256 = crypto.createHash('sha256').update(filename + Date.now()).digest('hex');

  const newShare = {
    id,
    filename: filename || 'secure_archive.zip',
    sizeMb: parseFloat(sizeMb) || 5.2,
    mimeType: 'application/octet-stream',
    sender: sender || 'operator@filebridge.io',
    createdAt: now.toISOString(),
    expiresAt,
    maxDownloads: parseInt(maxDownloads) || 1,
    downloadCount: 0,
    hasPassword: Boolean(hasPassword),
    burnAfterReading: Boolean(burnAfterReading),
    encryption: 'AES-256-GCM (Client-Side Encrypted)',
    sha256,
    status: 'ACTIVE'
  };

  shares.unshift(newShare);

  // Add audit log
  auditLogs.unshift({
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    fileId: id,
    action: 'SHARE_LINK_GENERATED',
    ipAddress: req.ip || '127.0.0.1',
    location: 'Encrypted Gateway Node',
    userAgent: req.headers['user-agent'] || 'Client WebApp',
    timestamp: now.toISOString(),
    status: '201 CREATED',
    passwordUsed: Boolean(hasPassword)
  });

  res.status(201).json(newShare);
});

// Download / Decrypt file
app.post('/api/v1/shares/:id/download', (req, res) => {
  const share = shares.find(s => s.id === req.params.id);
  if (!share) return res.status(404).json({ error: 'File not found or already purged' });

  if (share.status === 'BURNED') {
    return res.status(410).json({ error: 'This file has already been burned after its single reading' });
  }

  share.downloadCount += 1;

  const now = new Date().toISOString();
  let actionTaken = 'DOWNLOAD_SUCCESS';

  if (share.burnAfterReading || share.downloadCount >= share.maxDownloads) {
    share.status = 'BURNED';
    actionTaken = 'DOWNLOAD_AND_PURGE';
  }

  auditLogs.unshift({
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    fileId: share.id,
    action: actionTaken,
    ipAddress: '203.0.113.19',
    location: 'Verified Recipient Node',
    userAgent: 'Secure Browser Client',
    timestamp: now,
    status: share.status === 'BURNED' ? '200 OK (BURNED)' : '200 OK',
    passwordUsed: share.hasPassword
  });

  res.json({
    message: 'Decryption payload verified. Streaming cipher stream.',
    share,
    decryptedChecksum: share.sha256
  });
});

// Audit logs
app.get('/api/v1/audit-logs', (req, res) => {
  res.json(auditLogs);
});

app.listen(PORT, () => {
  console.log(`FileBridge backend listening on port http://localhost:${PORT}`);
});
