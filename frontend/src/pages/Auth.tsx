import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    if (apiService.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.login(email, password);

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-customWhite p-4">
      <Card className="w-full max-w-md rounded-xl px-5 py-10 bg-customNavy text-customWhite">
        <CardHeader className="text-center p-0">
          <img
            src="/hauss-logo.png"
            alt=""
            className="h-24 mx-auto bg-customNavy p-2 mb-5 rounded-lg"
          />
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription className="text-customWhite">
            Welcome back to Hauss Realty
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-12 rounded-xl bg-customWhite text-customNavy"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="h-12 rounded-xl bg-customWhite text-customNavy"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12 bg-customOrange text-customNavy hover:text-customWhite"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
