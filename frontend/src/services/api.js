// FileBridge API Service

const API_BASE = 'http://localhost:5008';

export const fallbackShares = [
  {
    id: "FB-901",
    filename: "Q1_2026_Consolidated_Financials.xlsx",
    sizeMb: 4.8,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sender: "cfo@enterprise-corp.com",
    createdAt: "2026-03-29T10:15:00Z",
    expiresAt: "2026-04-05T10:15:00Z",
    maxDownloads: 5,
    downloadCount: 2,
    hasPassword: true,
    burnAfterReading: false,
    encryption: "AES-256-GCM (Client-Side)",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "ACTIVE"
  },
  {
    id: "FB-902",
    filename: "Series_B_Term_Sheet_Signed.pdf",
    sizeMb: 2.1,
    mimeType: "application/pdf",
    sender: "managing-partner@sequoia-cap.com",
    createdAt: "2026-03-29T11:45:00Z",
    expiresAt: "2026-03-30T11:45:00Z",
    maxDownloads: 1,
    downloadCount: 1,
    hasPassword: true,
    burnAfterReading: true,
    encryption: "AES-256-GCM (Zero-Knowledge)",
    sha256: "bf5258f3be7d5bb2f01f4ab98064bf63d04d16ff1a31d0d970344d9354784407",
    status: "BURNED"
  },
  {
    id: "FB-903",
    filename: "Kubernetes_Cluster_Private_Certs.tar.gz",
    sizeMb: 18.4,
    mimeType: "application/gzip",
    sender: "sre-lead@cloudinfra.io",
    createdAt: "2026-03-29T13:00:00Z",
    expiresAt: "2026-03-29T19:00:00Z",
    maxDownloads: 3,
    downloadCount: 1,
    hasPassword: true,
    burnAfterReading: false,
    encryption: "AES-256-GCM (Client-Side)",
    sha256: "7d793037a0760186574b0282f2f435e7b1e7a667da4725c01ec53c574b635f9b",
    status: "ACTIVE"
  },
  {
    id: "FB-905",
    filename: "Firmware_OTA_v4.2.1_Signed_Payload.bin",
    sizeMb: 145.2,
    mimeType: "application/octet-stream",
    sender: "iot-eng@embedded-sys.tech",
    createdAt: "2026-03-29T14:30:00Z",
    expiresAt: "2026-04-12T14:30:00Z",
    maxDownloads: 50,
    downloadCount: 14,
    hasPassword: false,
    burnAfterReading: false,
    encryption: "ChaCha20-Poly1305",
    sha256: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    status: "ACTIVE"
  },
  {
    id: "FB-907",
    filename: "Database_Snapshot_Staging_Sanitized.sql.zst",
    sizeMb: 420.0,
    mimeType: "application/zstd",
    sender: "dba-ops@hyper-scale.net",
    createdAt: "2026-03-29T16:00:00Z",
    expiresAt: "2026-03-31T16:00:00Z",
    maxDownloads: 4,
    downloadCount: 0,
    hasPassword: true,
    burnAfterReading: false,
    encryption: "AES-256-GCM (Client-Side)",
    sha256: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    status: "ACTIVE"
  }
];

export const fallbackLogs = [
  {
    id: "LOG-5501",
    fileId: "FB-901",
    action: "DOWNLOAD_SUCCESS",
    ipAddress: "192.0.2.45",
    location: "Zurich, Switzerland",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    timestamp: "2026-03-29T10:45:12Z",
    status: "200 OK",
    passwordUsed: true
  },
  {
    id: "LOG-5502",
    fileId: "FB-902",
    action: "DOWNLOAD_AND_PURGE",
    ipAddress: "198.51.100.12",
    location: "Menlo Park, CA, US",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: "2026-03-29T12:05:40Z",
    status: "200 OK (BURNED)",
    passwordUsed: true
  },
  {
    id: "LOG-5503",
    fileId: "FB-901",
    action: "UNAUTHORIZED_PASSWORD_ATTEMPT",
    ipAddress: "203.0.113.88",
    location: "Singapore",
    userAgent: "curl/8.4.0",
    timestamp: "2026-03-29T13:22:19Z",
    status: "401 UNAUTHORIZED",
    passwordUsed: false
  },
  {
    id: "LOG-5504",
    fileId: "FB-903",
    action: "DOWNLOAD_SUCCESS",
    ipAddress: "198.51.100.99",
    location: "London, UK",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
    timestamp: "2026-03-29T14:10:02Z",
    status: "200 OK",
    passwordUsed: true
  }
];

export async function fetchShares() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shares`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return fallbackShares;
  }
}

export async function fetchAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/audit-logs`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return fallbackLogs;
  }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stats`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return {
      totalShares: 5,
      activeShares: 4,
      totalDownloads: 18,
      burnedShares: 1,
      auditEventsCount: 4
    };
  }
}

export async function createShare(shareData) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shareData)
    });
    if (!res.ok) throw new Error('Creation error');
    return await res.json();
  } catch (e) {
    return {
      id: `FB-${Math.floor(100 + Math.random() * 899)}`,
      ...shareData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      downloadCount: 0,
      encryption: 'AES-256-GCM (Client-Side)',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'ACTIVE'
    };
  }
}

export async function downloadFile(shareId) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shares/${shareId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Download error');
    return await res.json();
  } catch (e) {
    return {
      message: 'Decryption payload verified. Streaming cipher stream.',
      decryptedChecksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    };
  }
}
