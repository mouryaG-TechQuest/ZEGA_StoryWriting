declare const authService: {
  register: (username: string, password: string, confirmPassword: string, firstName: string, lastName: string, email: string, phoneNumber?: string) => Promise<any>;
  login: (username: string, password: string) => Promise<{ token?: string; username?: string; firstName?: string; lastName?: string; email?: string }>;
  logout: () => void;
  getToken: () => string | null;
  verifyEmail: (token: string) => Promise<{ verified?: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, resetCode: string, newPassword: string, confirmPassword: string) => Promise<any>;
  forgotUsername: (email: string) => Promise<any>;
  updateProfile: (profileData: any) => Promise<any>;
};
export default authService;

