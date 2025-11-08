declare module 'bzip2-wasm' {
  export default class BZip2 {
    init(): Promise<void>
    compress(data: Uint8Array, blockSize: number): Uint8Array
    decompress(data: Uint8Array): Uint8Array
  }
}
