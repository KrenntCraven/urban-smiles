/** In-memory / storage photo: bytes plus the mime type we later put on the bucket object. */
export type FileBlob = {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
  size: number;
};
