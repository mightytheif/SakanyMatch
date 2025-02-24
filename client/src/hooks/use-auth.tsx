import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, isLandlord: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; email?: string; password?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAdmin: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

// Admin emails list - in a real app, this would be in a secure environment variable
const ADMIN_EMAILS = ['admin@sakany.com'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email!) : false);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginAsAdmin = async (email: string, password: string) => {
    try {
      if (!ADMIN_EMAILS.includes(email)) {
        throw new Error("This email is not authorized as admin");
      }
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in as administrator",
      });
    } catch (error: any) {
      toast({
        title: "Admin Login Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, isLandlord: boolean) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Store the isLandlord status and check if it's an admin email
      const isAdminEmail = ADMIN_EMAILS.includes(email);
      await updateProfile(user, {
        displayName: `${name}|${isLandlord ? 'landlord' : 'user'}${isAdminEmail ? '|admin' : ''}`
      });

      toast({
        title: "Welcome to SAKANY!",
        description: "Your account has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "Come back soon!",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password",
      });
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string; email?: string; password?: string }) => {
    if (!auth.currentUser) {
      throw new Error("No user is currently logged in");
    }

    try {
      const updates: Promise<void>[] = [];

      if (data.displayName) {
        // Preserve the user type (landlord/user) when updating the display name
        const currentDisplayName = auth.currentUser.displayName || "";
        const userType = currentDisplayName.split("|")[1] || "user";
        updates.push(updateProfile(auth.currentUser, {
          displayName: `${data.displayName}|${userType}`
        }));
      }

      if (data.email) {
        updates.push(updateEmail(auth.currentUser, data.email));
      }

      if (data.password) {
        updates.push(updatePassword(auth.currentUser, data.password));
      }

      await Promise.all(updates);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) {
      throw new Error("No user is currently logged in");
    }

    try {
      await deleteUser(auth.currentUser);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        deleteAccount,
        isAdmin,
        loginAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}