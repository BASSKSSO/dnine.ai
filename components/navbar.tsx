'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Menu, X, Scissors, LogOut, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, signOut, credits } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" strokeDasharray="4 2" className="opacity-60" />
              <path d="M12 2 L12 22" strokeDasharray="2 2" />
              <polygon points="12,6 16,12 12,18 8,12" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="gradient-text">Dnine.ai</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <Link href="/tool" className="transition-colors hover:text-primary">Remove BG</Link>
          {user && <Link href="/dashboard" className="transition-colors hover:text-primary">Dashboard</Link>}
          <Link href="/api-keys" className="transition-colors hover:text-primary">API Keys</Link>
          <Link href="/docs" className="transition-colors hover:text-primary">Docs</Link>
          <Link href="/pricing" className="transition-colors hover:text-primary">Pricing</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <CreditCard className="h-3 w-3" />
                {credits} credits
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 glass p-4 space-y-3">
          <Link href="/" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/tool" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Remove BG</Link>
          {user && <Link href="/dashboard" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Dashboard</Link>}
          <Link href="/api-keys" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>API Keys</Link>
          <Link href="/docs" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Docs</Link>
          <Link href="/pricing" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <div className="pt-2 border-t border-border/40 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <CreditCard className="h-3 w-3" /> {credits} credits
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
