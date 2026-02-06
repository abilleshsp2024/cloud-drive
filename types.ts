
export type FileType = 'folder' | 'image' | 'pdf' | 'doc' | 'other';

export interface DriveItem {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  ownerId: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  s3Url?: string; // Simulated AWS S3 path
}

export interface User {
  id: string;
  username: string; // email
  firstName: string;
  lastName: string;
  isActive: boolean;
  parentId?: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
