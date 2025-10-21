'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // TEMPORARY: Auto-redirect to dashboard for testing (bypass login)
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Login Card */}
      <div className="glass-card p-8 md:p-12 w-full max-w-md relative z-10 float-animation">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <div className="w-20 h-20 rounded-full animated-gradient mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-gray-400">ItsYouApp Management Dashboard</p>
        </div>

        {/* Redirecting Message */}
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-white text-lg">Redirecting to dashboard...</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Admin access only
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="w-2 h-2 rounded-full bg-green-500 glow"></div>
            <p className="text-xs text-gray-500">System Online</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
