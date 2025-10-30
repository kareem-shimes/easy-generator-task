export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  phone?: string;
  location?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  newsletter: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}
