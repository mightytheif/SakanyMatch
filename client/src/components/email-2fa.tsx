import { useState } from "react";
import {
  EmailAuthProvider,
  multiFactor,
  sendEmailVerification,
} from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmailTwoFactorAuth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);

  const mfa = user ? multiFactor(user) : null;
  const isEnabled = mfa?.enrolledFactors?.length > 0;

  const enableEmailTwoFactor = async () => {
    if (!user || !user.emailVerified) {
      toast({
        title: "Email verification required",
        description: "Please verify your email address before enabling 2FA",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEnabling(true);

      // Create the email auth provider
      const provider = new EmailAuthProvider();

      // Get the MFA session
      const multiFactorSession = await multiFactor(user).getSession();

      // Enroll the email as a second factor
      await multiFactor(user).enroll(multiFactorSession, "Email verification");

      toast({
        title: "Success",
        description: "Email-based two-factor authentication has been enabled",
      });
    } catch (error: any) {
      console.error("2FA Error:", error);
      let errorMessage = error.message;

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Please sign out and sign in again to enable 2FA";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const disableEmailTwoFactor = async () => {
    if (!user || !mfa?.enrolledFactors[0]) return;

    try {
      setIsEnabling(true);
      await multiFactor(user).unenroll(mfa.enrolledFactors[0]);

      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security by requiring email verification when signing in from a new device
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          <div className="space-y-4">
            <p className="text-sm">
              Email-based two-factor authentication is currently enabled. A verification code will be sent to your email when signing in from unrecognized devices.
            </p>
            <Button
              onClick={disableEmailTwoFactor}
              variant="destructive"
              disabled={isEnabling}
            >
              {isEnabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When enabled, you'll need to verify your identity through your email when signing in from a new device.
            </p>
            <Button
              onClick={enableEmailTwoFactor}
              disabled={isEnabling || !user?.emailVerified}
            >
              {isEnabling ? "Enabling..." : "Enable Email 2FA"}
            </Button>
            {!user?.emailVerified && (
              <p className="text-sm text-amber-600">
                Please verify your email address first before enabling two-factor authentication.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
