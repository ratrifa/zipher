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
