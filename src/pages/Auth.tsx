import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  User,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { z } from "zod";
import auraLogo from "@/assets/aura-auth-logo.png";
import auraScriptLogo from "@/assets/aura-script-logo.png";
import { supabase } from "@/integrations/supabase/client";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

type AuthMode = "login" | "signup" | "forgot" | "reset-sent";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useDocumentTitle(mode === "login" ? "Login" : mode === "signup" ? "Sign Up" : "Reset Password");

  const validateField = (field: string, value: string): string | null => {
    try {
      switch (field) {
        case "email":
          emailSchema.parse(value);
          break;
        case "password":
          passwordSchema.parse(value);
          break;
        case "fullName":
          nameSchema.parse(value);
          break;
        case "confirmPassword":
          if (value !== password) return "Passwords do not match";
          break;
      }
      return null;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0].message;
      }
      return "Invalid input";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Login failed", { description: error.message });
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!", {
      description: "You have successfully logged in.",
    });

    window.location.href = "/";
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const nameError = validateField("fullName", fullName);
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);
    const confirmError = validateField("confirmPassword", confirmPassword);

    if (nameError) newErrors.fullName = nameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error("Sign up failed", { description: error.message });
      setIsLoading(false);
      return;
    }

    toast.success("Account created!", {
      description: "Please check your email to verify your account.",
    });

    setMode("login");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateField("email", email);

    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error("Reset failed", { description: error.message });
      setIsLoading(false);
      return;
    }

    setMode("reset-sent");
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setErrors({});
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 xl:p-16 w-full h-full">
          {/* Script Logo - inverted to white */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img 
              src={auraScriptLogo} 
              alt="Aura" 
              className="w-64 xl:w-80 h-auto invert brightness-0 invert"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </motion.div>
        </div>

        {/* Footer - positioned absolutely */}
        <div className="absolute bottom-0 left-0 right-0 p-12 xl:p-16 z-10">

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-sm text-white/50"
          >
            © 2026 Aura. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 flex items-center justify-center">
          <img 
            src={auraLogo} 
            alt="Aura" 
            className="w-16 h-16 rounded-xl shadow-lg"
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {/* Login Form */}
              {mode === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                    <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn("pl-10", errors.email && "border-danger")}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={cn("pl-10 pr-10", errors.password && "border-danger")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                        Remember me for 30 days
                      </Label>
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>

                </motion.div>
              )}

              {/* Signup Form */}
              {mode === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Create an account</h2>
                    <p className="text-muted-foreground mt-2">Get started with your free account today</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={cn("pl-10", errors.fullName && "border-danger")}
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn("pl-10", errors.email && "border-danger")}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signupPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={cn("pl-10 pr-10", errors.password && "border-danger")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
                      <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={cn("pl-10", errors.confirmPassword && "border-danger")}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-danger">{errors.confirmPassword}</p>}
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <button
                      onClick={() => switchMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}

              {/* Forgot Password Form */}
              {mode === "forgot" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => switchMode("login")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>

                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
                    <p className="text-muted-foreground mt-2">
                      No worries, we'll send you reset instructions.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn("pl-10", errors.email && "border-danger")}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Reset Sent Confirmation */}
              {mode === "reset-sent" && (
                <motion.div
                  key="reset-sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
                  <p className="text-muted-foreground mb-6">
                    We sent a password reset link to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>

                  <Button 
                    className="w-full" 
                    onClick={() => switchMode("login")}
                  >
                    Back to Login
                  </Button>

                  <p className="text-sm text-muted-foreground mt-6">
                    Didn't receive the email?{" "}
                    <button
                      onClick={() => setMode("forgot")}
                      className="text-primary font-medium hover:underline"
                    >
                      Click to resend
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden p-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Aura. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;