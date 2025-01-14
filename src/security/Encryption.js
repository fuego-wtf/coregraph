import { createHash } from 'crypto';

export class SecurityManager {
  static async hashData(data) {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  static async verifyChunk(chunk, signature) {
    const hash = await this.hashData(chunk);
    return hash === signature;
  }
} 