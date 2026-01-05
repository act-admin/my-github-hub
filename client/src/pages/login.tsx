
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import scodacLogo from "@assets/ScodacLogoApproved.png";
import { Eye, EyeOff, Zap, Shield, BarChart3 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      if (email === "admin@scodac.com" && password === "Scodac@ai$123") {
        // Store login state
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", email);
        
        toast({
          title: "Login Successful",
          description: "Welcome back to Billion Dollar Blank Screen!",
        });
        
        setLocation("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="bg-background flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo & Subheading */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-4">
              <img
                src={scodacLogo}
                alt="SCODAC"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              AI EXPERIENCE COMMAND CENTER
            </p>
          </div>

          {/* Sign In Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground text-center tracking-tight">
              Sign In
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-muted/50 border-border/60 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-11 bg-muted/50 border-border/60 focus:bg-background focus:border-primary/50 transition-all duration-200 rounded-lg"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <a
                href="#"
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors duration-200"
              >
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-medium text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing in..." : "Continue"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-muted-foreground text-sm">Not a Member yet? </span>
            <a href="#" className="text-accent hover:text-accent/80 font-medium text-sm transition-colors duration-200">
              Sign up
            </a>
          </div>

          <div className="mt-12 pt-6 border-t border-border/50 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors duration-200">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors duration-200">Plans</a>
            <a href="#" className="hover:text-foreground transition-colors duration-200">Contact Us</a>
          </div>
        </div>
      </div>

      {/* Right Side - Orange Background with Content */}
      <div className="hidden lg:flex bg-accent relative overflow-hidden items-center justify-center p-12 xl:p-16">
        {/* AI Abstract Visual Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Neural network nodes */}
            <circle cx="200" cy="200" r="8" fill="white"/>
            <circle cx="400" cy="150" r="6" fill="white"/>
            <circle cx="600" cy="200" r="10" fill="white"/>
            <circle cx="150" cy="400" r="7" fill="white"/>
            <circle cx="350" cy="350" r="12" fill="white"/>
            <circle cx="550" cy="380" r="8" fill="white"/>
            <circle cx="700" cy="420" r="6" fill="white"/>
            <circle cx="250" cy="550" r="9" fill="white"/>
            <circle cx="450" cy="500" r="10" fill="white"/>
            <circle cx="650" cy="580" r="7" fill="white"/>
            <circle cx="300" cy="700" r="8" fill="white"/>
            <circle cx="500" cy="680" r="6" fill="white"/>
            {/* Connection lines */}
            <line x1="200" y1="200" x2="400" y2="150" stroke="white" strokeWidth="1"/>
            <line x1="400" y1="150" x2="600" y2="200" stroke="white" strokeWidth="1"/>
            <line x1="200" y1="200" x2="350" y2="350" stroke="white" strokeWidth="1"/>
            <line x1="350" y1="350" x2="550" y2="380" stroke="white" strokeWidth="1"/>
            <line x1="150" y1="400" x2="350" y2="350" stroke="white" strokeWidth="1"/>
            <line x1="550" y1="380" x2="700" y2="420" stroke="white" strokeWidth="1"/>
            <line x1="250" y1="550" x2="450" y2="500" stroke="white" strokeWidth="1"/>
            <line x1="450" y1="500" x2="650" y2="580" stroke="white" strokeWidth="1"/>
            <line x1="350" y1="350" x2="450" y2="500" stroke="white" strokeWidth="1"/>
            <line x1="300" y1="700" x2="500" y2="680" stroke="white" strokeWidth="1"/>
            <line x1="250" y1="550" x2="300" y2="700" stroke="white" strokeWidth="1"/>
          </svg>
        </div>
        
        {/* Glowing orbs */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="w-full max-w-xl text-white relative z-10">
          <div className="space-y-10">
            <div className="space-y-5">
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-primary">
                Transform Your Business with AI-Powered Analytics
              </h2>
              
              <p className="text-white/90 text-lg xl:text-xl leading-relaxed">
                SCODAC combines advanced data analytics with artificial intelligence to deliver 
                actionable insights that drive business growth and operational efficiency.
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors duration-300">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-primary">Real-Time Insights</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Get instant access to critical business metrics and analytics</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors duration-300">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-primary">Enterprise Security</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Bank-level encryption and compliance with industry standards</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors duration-300">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-primary">AI-Driven Automation</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Automate workflows and decision-making processes intelligently</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
