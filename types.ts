export enum Status {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FileData {
  file: File;
  previewUrl: string | null;
  type: 'image' | 'pdf';
}
