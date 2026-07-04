import crypto from "crypto";

const IV_LENGTH = 16;

function getEncryptionKey() {
  let key = process.env.HIS_ENCRYPTION_KEY || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (process.env.NODE_ENV === "production" && !key) {
    throw new Error("Missing HIS_ENCRYPTION_KEY or AUTH_SECRET in production environment");
  }
  
  if (!key) {
    key = "default_his_encryption_key_32_ch"; 
  }

  return crypto.createHash("sha256").update(key).digest("base64").substring(0, 32);
}

export function encryptHisSecret(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(getEncryptionKey()), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString("hex") + ":" + encrypted.toString("hex") + ":" + authTag.toString("hex");
  } catch (e) {
    console.error("Encryption failed:", e);
    return null; 
  }
}

export function decryptHisSecret(text: string | null | undefined): string | null {
  if (!text) return null;
  if (!text.includes(":")) return text; // Fallback for existing plaintext in DB
  try {
    const textParts = text.split(":");
    
    if (textParts.length === 2) {
      // Legacy CBC mode: iv:encrypted
      const iv = Buffer.from(textParts[0], "hex");
      const encryptedText = Buffer.from(textParts[1], "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(getEncryptionKey()), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } else if (textParts.length === 3) {
      // GCM mode: iv:encrypted:authTag
      const iv = Buffer.from(textParts[0], "hex");
      const encryptedText = Buffer.from(textParts[1], "hex");
      const authTag = Buffer.from(textParts[2], "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(getEncryptionKey()), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    }
    
    return null;
  } catch (e) {
    console.error("Decryption failed:", e);
    return null; 
  }
}
