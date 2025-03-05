import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Phone } from "lucide-react";
import {
  getAuth,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  User,
  MultiFactorUser
} from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export function SMS2FASetup() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();

  // Function to check if MFA is enabled
  const isMFAEnabled = () => {
    if (!user) return false;
    const multiFactorUser = user as unknown as MultiFactorUser;
    return multiFactorUser.multiFactor?.enrolledFactors?.length > 0;
  };

  // Function to set up reCAPTCHA verifier
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  // Function to start phone verification
  const startPhoneVerification = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to set up 2FA",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setupRecaptcha();

      const multiFactorUser = user as unknown as MultiFactorUser;
      const session = await multiFactorUser.multiFactor?.getSession();

      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: session
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier
      );

      setVerificationId(verificationId);
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code",
      });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify code and enroll MFA
  const verifyAndEnroll = async () => {
    if (!verificationId || !user) return;

    try {
      setIsLoading(true);
      const multiFactorUser = user as unknown as MultiFactorUser;
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await multiFactorUser.multiFactor?.enroll(multiFactorAssertion, "Phone Number");

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled",
      });

      // Reset form
      setPhoneNumber("");
      setVerificationCode("");
      setVerificationId(null);
    } catch (error: any) {
      console.error("Error enrolling in MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enable two-factor authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unenroll from MFA
  const unenrollMFA = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const multiFactorUser = user as unknown as MultiFactorUser;
      const enrolledFactors = await multiFactorUser.multiFactor?.getEnrolledFactors();
      if (enrolledFactors?.length > 0) {
        await multiFactorUser.multiFactor?.unenroll(enrolledFactors[0]);
        toast({
          title: "Success",
          description: "Two-factor authentication has been disabled",
        });
      }
    } catch (error: any) {
      console.error("Error disabling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable two-factor authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div id="recaptcha-container"></div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>SMS Two-Factor Authentication</Label>
          <Switch
            checked={isMFAEnabled()}
            onCheckedChange={(checked) => {
              if (!checked) {
                unenrollMFA();
              }
            }}
            disabled={isLoading}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account by requiring a verification code sent to your phone.
        </p>
      </div>

      {!isMFAEnabled() && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading || !!verificationId}
              />
              <Button
                onClick={startPhoneVerification}
                disabled={isLoading || !phoneNumber || !!verificationId}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Send Code
              </Button>
            </div>
          </div>

          {verificationId && (
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={verifyAndEnroll}
                  disabled={isLoading || !verificationCode}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}