import { generateMnemonic, validateMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"

export function generateSeedPhrase(): string {
  return generateMnemonic(wordlist, 256)
}

export function validateSeedPhrase(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist)
}

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return arr
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function deriveSeedKey(mnemonic: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(mnemonic), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: hexToBytes(saltHex).buffer as ArrayBuffer, iterations: 310_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptPrivateKeyWithSeedPhrase(
  privateKeyBase64: string,
  mnemonic: string
): Promise<{ encryptedKey: string; saltHex: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const saltHex = bytesToHex(salt)
  const aesKey = await deriveSeedKey(mnemonic, saltHex)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(privateKeyBase64)
  )
  const blob = new Uint8Array(iv.length + encrypted.byteLength)
  blob.set(iv)
  blob.set(new Uint8Array(encrypted), iv.length)
  return { encryptedKey: btoa(String.fromCharCode(...blob)), saltHex }
}

export async function decryptPrivateKeyWithSeedPhrase(
  encryptedKeyBase64: string,
  saltHex: string,
  mnemonic: string
): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const aesKey = await deriveSeedKey(mnemonic, saltHex)
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, data)
  return new TextDecoder().decode(decrypted)
}

export async function importPublicKey(pemBase64: string) {
  const binaryString = window.atob(pemBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return await window.crypto.subtle.importKey(
    "spki",
    bytes.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  )
}

export async function importPrivateKey(pemBase64: string) {
  const binaryString = window.atob(pemBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return await window.crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  )
}

export async function encryptAESKey(aesKey: string, publicKey: CryptoKey) {
  const encoder = new TextEncoder()
  const data = encoder.encode(aesKey)
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
  )
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
}

export async function decryptAESKey(encryptedAesKey: string, privateKey: CryptoKey) {
  const binaryString = window.atob(encryptedAesKey)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    bytes.buffer
  )
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
}

export async function exportAESKey(key: CryptoKey) {
  const exported = await window.crypto.subtle.exportKey("raw", key)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

export async function importAESKey(keyBase64: string) {
  const binaryString = window.atob(keyBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return await window.crypto.subtle.importKey(
    "raw",
    bytes.buffer,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  )
}

export async function encryptData(data: ArrayBuffer, key: CryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  )

  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return combined.buffer
}

export async function decryptData(combinedData: ArrayBuffer, key: CryptoKey) {
  const iv = new Uint8Array(combinedData.slice(0, 12))
  const data = combinedData.slice(12)

  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  )
}

const IDB_NAME = "zipher-keys"
const IDB_STORE = "keys"
const IDB_KEY = "private_key"

function openKeysDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function savePrivateKey(pemBase64: string): Promise<void> {
  const cryptoKey = await importPrivateKey(pemBase64)
  const db = await openKeysDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite")
    const req = tx.objectStore(IDB_STORE).put(cryptoKey, IDB_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function loadPrivateKey(): Promise<CryptoKey | null> {
  const db = await openKeysDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly")
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
    req.onsuccess = () => resolve((req.result as CryptoKey) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function clearPrivateKey(): Promise<void> {
  const db = await openKeysDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite")
    const req = tx.objectStore(IDB_STORE).delete(IDB_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
