import crypto from 'crypto';
import { prisma } from '../../app/db';

function toNativeConfigDto(config: any, newSharedSecret?: string) {
  const { sharedSecret, ...rest } = config;
  return newSharedSecret ? { ...rest, newSharedSecret } : rest;
}

function validateNativeBaseUrl(isEnabled: boolean, baseUrl: string) {
  if (!isEnabled) return;
  if (!baseUrl) throw new Error('Base URL is required when enabling Native Companion');

  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Native Companion Base URL must use http or https');
    }
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      throw new Error('Native Companion Base URL must be localhost or 127.0.0.1 for security reasons');
    }
  } catch (e: any) {
    if (e.message.includes('Native Companion')) throw e;
    throw new Error(`Invalid Base URL: ${e.message}`);
  }
}

export async function getNativeConfig() {
  const config = await prisma.nativeConnectorConfig.findFirst();
  if (!config) return null;
  return toNativeConfigDto(config);
}

export async function saveNativeConfig(userId: string, isEnabled: boolean, baseUrl: string) {
  validateNativeBaseUrl(isEnabled, baseUrl);

  const existing = await prisma.nativeConnectorConfig.findFirst();
  const newSharedSecret = !existing?.sharedSecret ? crypto.randomBytes(32).toString('hex') : undefined;

  let config;
  if (existing) {
    config = await prisma.nativeConnectorConfig.update({
      where: { id: existing.id },
      data: { isEnabled, baseUrl, ...(newSharedSecret ? { sharedSecret: newSharedSecret } : {}) }
    });
  } else {
    config = await prisma.nativeConnectorConfig.create({
      data: { 
        isEnabled, 
        baseUrl,
        sharedSecret: newSharedSecret
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: 'NATIVE_CONFIG_UPDATED',
      entityType: 'NativeConnectorConfig',
      entityId: config.id,
      metadataJson: JSON.stringify({ isEnabled, baseUrl: baseUrl ? '[REDACTED]' : null })
    }
  });

  return toNativeConfigDto(config, newSharedSecret);
}

export async function getNativeEvents(take: number = 20) {
  return await prisma.nativeConnectorEvent.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      actorUser: { select: { username: true } }
    }
  });
}



export async function generateNativeSignature(method: string, path: string) {
  if (method !== 'GET' || path !== '/health') {
    throw new Error('Native test signing is limited to GET /health');
  }

  const config = await prisma.nativeConnectorConfig.findFirst();
  if (!config?.isEnabled || !config.sharedSecret) throw new Error('Native Connector not configured or missing secret');
  
  const timestamp = Date.now().toString();
  const payload = `${method}:${path}:${timestamp}`;
  const signature = crypto.createHmac('sha256', config.sharedSecret).update(payload).digest('hex');
  
  return { timestamp, signature };
}
