import crypto from 'crypto';

/**
 * Resumable Chunked File Upload Protocol Manager
 * Manages chunk assembly, per-chunk SHA-256 validation, out-of-order chunk arrivals,
 * resume state querying, and final assembled payload integrity verification.
 */

export const DEFAULT_CHUNK_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB standard S3/TUS chunk size

export const UPLOAD_SESSION_STATUS = {
  INITIALIZED: 'INITIALIZED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
  EXPIRED: 'EXPIRED'
};

export class ResumableChunkedUploadManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.defaultChunkSize=5242880] - Default chunk size in bytes
   * @param {number} [options.sessionTimeoutMs=86400000] - 24 hours expiry
   * @param {number} [options.maxFileSize=1073741824] - 1 GB max file size
   */
  constructor(options = {}) {
    this.defaultChunkSize = options.defaultChunkSize || DEFAULT_CHUNK_SIZE_BYTES;
    this.sessionTimeoutMs = options.sessionTimeoutMs || 24 * 60 * 60 * 1000;
    this.maxFileSize = options.maxFileSize || 1024 * 1024 * 1024;

    // uploadId -> UploadSession
    this.sessions = new Map();
  }

  /**
   * Initiate a new chunked upload session
   * @param {Object} params
   * @param {string} params.filename
   * @param {number} params.totalSizeBytes
   * @param {number} [params.chunkSize]
   * @param {string} [params.expectedFileSha256]
   * @param {string} [params.mimeType]
   * @param {string} [params.ownerId]
   * @returns {Object} Upload session metadata with unique uploadId
   */
  initiateUploadSession(params) {
    const {
      filename,
      totalSizeBytes,
      chunkSize = this.defaultChunkSize,
      expectedFileSha256 = null,
      mimeType = 'application/octet-stream',
      ownerId = 'anonymous'
    } = params;

    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename is required.');
    }
    if (!totalSizeBytes || totalSizeBytes <= 0) {
      throw new Error('totalSizeBytes must be a positive number.');
    }
    if (totalSizeBytes > this.maxFileSize) {
      throw new Error(`File size (${totalSizeBytes} bytes) exceeds max limit of ${this.maxFileSize} bytes.`);
    }

    const totalChunks = Math.ceil(totalSizeBytes / chunkSize);
    const uploadId = crypto.randomUUID();
    const now = Date.now();

    const session = {
      uploadId,
      filename,
      totalSizeBytes,
      chunkSize,
      totalChunks,
      expectedFileSha256,
      mimeType,
      ownerId,
      status: UPLOAD_SESSION_STATUS.INITIALIZED,
      createdAt: now,
      lastUpdatedAt: now,
      expiresAt: now + this.sessionTimeoutMs,
      uploadedBytes: 0,
      chunks: new Map(), // chunkIndex -> { buffer, sha256, sizeBytes, receivedAt }
      finalFileSha256: null
    };

    this.sessions.set(uploadId, session);

    return {
      uploadId,
      filename,
      totalSizeBytes,
      chunkSize,
      totalChunks,
      status: session.status,
      expiresAt: new Date(session.expiresAt).toISOString()
    };
  }

  /**
   * Upload an individual chunk with SHA-256 verification
   * @param {string} uploadId
   * @param {number} chunkIndex - 0-based chunk index
   * @param {Buffer|Uint8Array} chunkBuffer - Binary chunk payload
   * @param {string} [clientSha256] - Optional client computed SHA-256
   * @returns {Object} Chunk confirmation and updated upload progress
   */
  uploadChunk(uploadId, chunkIndex, chunkBuffer, clientSha256 = null) {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error(`Upload session "${uploadId}" not found.`);
    }

    if (session.status === UPLOAD_SESSION_STATUS.COMPLETED) {
      throw new Error(`Upload session "${uploadId}" is already finalized.`);
    }
    if (session.status === UPLOAD_SESSION_STATUS.ABORTED) {
      throw new Error(`Upload session "${uploadId}" has been aborted.`);
    }
    if (Date.now() > session.expiresAt) {
      session.status = UPLOAD_SESSION_STATUS.EXPIRED;
      throw new Error(`Upload session "${uploadId}" has expired.`);
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error(
        `Invalid chunk index ${chunkIndex}. Expected range: 0 to ${session.totalChunks - 1}.`
      );
    }

    const buffer = Buffer.isBuffer(chunkBuffer) ? chunkBuffer : Buffer.from(chunkBuffer);

    // Compute server-side SHA-256 of the chunk
    const serverSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // If client provided sha256, verify integrity
    if (clientSha256 && clientSha256.toLowerCase() !== serverSha256.toLowerCase()) {
      throw new Error(
        `Chunk ${chunkIndex} checksum mismatch! Client: ${clientSha256}, Server: ${serverSha256}`
      );
    }

    // Check if chunk was already uploaded
    const isNewChunk = !session.chunks.has(chunkIndex);
    if (isNewChunk) {
      session.uploadedBytes += buffer.length;
    }

    session.chunks.set(chunkIndex, {
      chunkIndex,
      sizeBytes: buffer.length,
      sha256: serverSha256,
      buffer,
      receivedAt: Date.now()
    });

    session.status = UPLOAD_SESSION_STATUS.IN_PROGRESS;
    session.lastUpdatedAt = Date.now();

    const progressPct = Number(((session.chunks.size / session.totalChunks) * 100).toFixed(1));

    return {
      uploadId,
      chunkIndex,
      chunkSizeBytes: buffer.length,
      chunkSha256: serverSha256,
      uploadedChunksCount: session.chunks.size,
      totalChunks: session.totalChunks,
      progressPct,
      isComplete: session.chunks.size === session.totalChunks
    };
  }

  /**
   * Get resume status for a session
   */
  getSessionStatus(uploadId) {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error(`Upload session "${uploadId}" not found.`);
    }

    const uploadedIndices = Array.from(session.chunks.keys()).sort((a, b) => a - b);
    const missingIndices = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!session.chunks.has(i)) {
        missingIndices.push(i);
      }
    }

    const progressPct = Number(((uploadedIndices.length / session.totalChunks) * 100).toFixed(1));

    return {
      uploadId,
      filename: session.filename,
      status: session.status,
      totalSizeBytes: session.totalSizeBytes,
      uploadedBytes: session.uploadedBytes,
      totalChunks: session.totalChunks,
      uploadedChunksCount: uploadedIndices.length,
      uploadedIndices,
      missingIndices,
      progressPct,
      isReadyToFinalize: missingIndices.length === 0
    };
  }

  /**
   * Finalize and stitch all uploaded chunks into complete file
   * @param {string} uploadId
   * @returns {Object} Finalized file metadata, assembled buffer, and whole-file SHA-256
   */
  finalizeUpload(uploadId) {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error(`Upload session "${uploadId}" not found.`);
    }

    if (session.chunks.size < session.totalChunks) {
      const missing = [];
      for (let i = 0; i < session.totalChunks; i++) {
        if (!session.chunks.has(i)) missing.push(i);
      }
      throw new Error(
        `Cannot finalize: missing ${missing.length} chunks (${missing.slice(0, 5).join(', ')}...).`
      );
    }

    // Assemble buffers in strict numerical sequence 0..N-1
    const orderedBuffers = [];
    for (let i = 0; i < session.totalChunks; i++) {
      orderedBuffers.push(session.chunks.get(i).buffer);
    }

    const assembledFileBuffer = Buffer.concat(orderedBuffers);

    if (assembledFileBuffer.length !== session.totalSizeBytes) {
      throw new Error(
        `Assembled size mismatch: expected ${session.totalSizeBytes} bytes, got ${assembledFileBuffer.length} bytes.`
      );
    }

    // Compute whole-file SHA-256
    const finalSha256 = crypto.createHash('sha256').update(assembledFileBuffer).digest('hex');

    // Verify expected whole-file hash if supplied on session init
    if (session.expectedFileSha256) {
      if (session.expectedFileSha256.toLowerCase() !== finalSha256.toLowerCase()) {
        throw new Error(
          `Final file integrity failure! Expected SHA-256: ${session.expectedFileSha256}, Computed: ${finalSha256}`
        );
      }
    }

    session.status = UPLOAD_SESSION_STATUS.COMPLETED;
    session.finalFileSha256 = finalSha256;
    session.lastUpdatedAt = Date.now();

    return {
      uploadId,
      filename: session.filename,
      status: session.status,
      totalSizeBytes: session.totalSizeBytes,
      finalSha256,
      mimeType: session.mimeType,
      assembledBuffer: assembledFileBuffer
    };
  }

  /**
   * Abort upload and free resources
   */
  abortSession(uploadId) {
    const session = this.sessions.get(uploadId);
    if (session) {
      session.chunks.clear();
      session.status = UPLOAD_SESSION_STATUS.ABORTED;
      this.sessions.delete(uploadId);
      return { uploadId, aborted: true };
    }
    return { uploadId, aborted: false, message: 'Session not found' };
  }
}

// Dual ESM & CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_CHUNK_SIZE_BYTES,
    UPLOAD_SESSION_STATUS,
    ResumableChunkedUploadManager
  };
}

export default ResumableChunkedUploadManager;
