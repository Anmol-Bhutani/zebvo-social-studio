"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/store/auth";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, token } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ user: { id: string; email: string; name: string }; token: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          auth: false,
        },
      );
      setAuth(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name}!`);
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6 safe-top safe-bottom safe-x">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex justify-center mb-8 group transition-transform hover:scale-[1.02]"
          aria-label="Zebvo home"
        >
          <Logo size="lg" />
        </Link>

        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="font-display text-xl sm:text-2xl font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Log in to your AI social studio
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brand.com"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" required>
                Password
              </Label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Log in
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-500 font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
