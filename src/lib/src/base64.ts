import { fromByteArray, toByteArray } from 'base64-js'

// Encode bytes to Base64URL (no padding)
export function encodeBase64Url(bytes: Uint8Array): string {
  return fromByteArray(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

// Decode Base64URL string to bytes
export function decodeBase64Url(input: string): Uint8Array {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  return toByteArray(b64)
}
