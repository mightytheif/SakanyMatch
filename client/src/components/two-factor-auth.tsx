import { useState } from "react";
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { auth } from "@/lib/firebase";

export function TwoFactorAuth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [step, setStep] = useState<"initial" | "verify">("initial");

  const mfa = user ? multiFactor(user) : null;
  const isEnabled = mfa?.enrolledFactors?.length > 0;

  const startEnrollment = async () => {
    if (!user || !phoneNumber) return;

    try {
      setIsEnrolling(true);

      // Format phone number if needed
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+966${phoneNumber.replace(/^0+/, '')}`;

      // Initialize RecaptchaVerifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signIn
        }
      });

      const multiFactorSession = await multiFactor(user).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        {
          phoneNumber: formattedPhone,
          session: multiFactorSession
        },
        recaptchaVerifier
      );

      setVerificationId(verificationId);
      setStep("verify");

      toast({
        title: "Verification code sent",
        description: "Please enter the code sent to your phone",
      });
    } catch (error: any) {
      console.error("2FA Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const finishEnrollment = async () => {
    if (!user || !verificationId || !verificationCode) return;

    try {
      setIsEnrolling(true);
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await multiFactor(user).enroll(multiFactorAssertion, "Phone number");

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled",
      });

      setStep("initial");
      setPhoneNumber("");
      setVerificationCode("");
    } catch (error: any) {
      console.error("2FA Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!user || !mfa?.enrolledFactors[0]) return;

    try {
      setIsEnrolling(true);
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
      setIsEnrolling(false);
    }
  };

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Phone Number</CardTitle>
          <CardDescription>
            Enter the verification code sent to your phone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={(value) => setVerificationCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => setStep("initial")}
            variant="outline"
          >
            Back
          </Button>
          <Button
            onClick={finishEnrollment}
            disabled={!verificationCode || isEnrolling}
          >
            {isEnrolling ? "Verifying..." : "Verify"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by enabling two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          <div className="space-y-4">
            <p className="text-sm">
              Two-factor authentication is currently enabled with phone number:{" "}
              <span className="font-medium">
                {mfa?.enrolledFactors[0].displayName}
              </span>
            </p>
            <Button
              onClick={disableTwoFactor}
              variant="destructive"
              disabled={isEnrolling}
            >
              {isEnrolling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="5XXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter your Saudi phone number (e.g., 5XXXXXXXX). The number will automatically be formatted with +966.
              </p>
            </div>
            <div id="recaptcha-container"></div>
            <Button
              onClick={startEnrollment}
              disabled={!phoneNumber || isEnrolling}
            >
              {isEnrolling ? "Sending code..." : "Enable 2FA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}