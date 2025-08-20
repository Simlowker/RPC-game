declare module 'sha2' {
  export class Sha256 {
    constructor();
    update(data: Uint8Array): void;
    digest(): Uint8Array;
  }
}