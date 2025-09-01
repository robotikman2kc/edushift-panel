// Simple local authentication system
interface AuthUser {
  id: string;
  email: string;
  nama: string;
  role: 'admin' | 'guru';
}

interface AuthSession {
  user: AuthUser;
  expires: string;
}

class LocalAuth {
  private sessionKey = 'localauth_session';
  private usersKey = 'localauth_users';

  // Initialize with default admin user
  constructor() {
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    const users = this.getUsers();
    if (users.length === 0) {
      // Create default admin user
      this.registerUser('admin@sekolah.com', 'Admin Sekolah', 'admin');
    }
  }

  private getUsers(): AuthUser[] {
    try {
      const data = localStorage.getItem(this.usersKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: AuthUser[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Register new user
  registerUser(email: string, nama: string, role: 'admin' | 'guru' = 'guru'): AuthUser {
    const users = this.getUsers();
    const newUser: AuthUser = {
      id: this.generateId(),
      email,
      nama,
      role
    };
    
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  // Sign in
  signIn(email: string, password?: string): { user: AuthUser; error: null } | { user: null; error: string } {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }

    // For demo purposes, accept any password or no password
    const session: AuthSession = {
      user,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    return { user, error: null };
  }

  // Get current session
  getSession(): { user: AuthUser | null; session: AuthSession | null } {
    try {
      const data = localStorage.getItem(this.sessionKey);
      if (!data) return { user: null, session: null };

      const session: AuthSession = JSON.parse(data);
      
      // Check if session is expired
      if (new Date(session.expires) < new Date()) {
        this.signOut();
        return { user: null, session: null };
      }

      return { user: session.user, session };
    } catch {
      return { user: null, session: null };
    }
  }

  // Sign out
  signOut(): void {
    localStorage.removeItem(this.sessionKey);
  }

  // Update user
  updateUser(userId: string, updates: Partial<Omit<AuthUser, 'id'>>): { user: AuthUser; error: null } | { user: null; error: string } {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { user: null, error: 'User not found' };
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users);

    // Update session if it's the current user
    const currentSession = this.getSession();
    if (currentSession.session && currentSession.user?.id === userId) {
      const updatedSession: AuthSession = {
        ...currentSession.session,
        user: users[userIndex]
      };
      localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
    }

    return { user: users[userIndex], error: null };
  }

  // Get all users (admin only)
  getAllUsers(): AuthUser[] {
    return this.getUsers();
  }

  // Delete user
  deleteUser(userId: string): { error: null } | { error: string } {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (users.length === filteredUsers.length) {
      return { error: 'User not found' };
    }

    this.saveUsers(filteredUsers);
    return { error: null };
  }
}

export const localAuth = new LocalAuth();