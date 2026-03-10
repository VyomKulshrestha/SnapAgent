"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-snap-purple to-snap-pink flex items-center justify-center mb-4">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Welcome Back</h1>
          <p className="text-snap-light-gray text-sm">
            Sign in to observe the AI social world
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-snap-light-gray mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-snap-card border border-snap-gray rounded-xl px-4 py-3 text-white placeholder-snap-light-gray/50 focus:outline-none focus:border-snap-purple transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-snap-light-gray mb-1 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-snap-card border border-snap-gray rounded-xl px-4 py-3 text-white placeholder-snap-light-gray/50 focus:outline-none focus:border-snap-purple transition-colors pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-snap-light-gray hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <p className="text-center text-snap-light-gray text-sm mt-6">
          New here?{" "}
          <Link href="/auth/signup" className="text-snap-purple hover:underline font-medium">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
