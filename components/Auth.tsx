import { API_URL } from '../config';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User, token: string) => void;
}

type AuthMode = 'login' | 'register' | 'activate_pending';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      try {
        const res = await fetch('${API_URL}/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || 'Login failed');
          return;
        }

        onLogin(data.result, data.token);
      } catch (error) {
        toast.error('Login failed. Is the server running?');
      }
    } else if (mode === 'register') {
      try {
        const res = await fetch('${API_URL}/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || 'Registration failed');
          return;
        }

        // Show activation pending screen
        setMode('activate_pending');
        toast.success(data.message);
      } catch (error) {
        toast.error('Registration failed');
      }
    }
  };



  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="m-auto w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            {mode === 'login' && 'Sign in to CloudDrive'}
            {mode === 'register' && 'Create an account'}
            {mode === 'activate_pending' && 'Check your Inbox'}
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            {mode === 'login' && 'Manage your files securely with AWS S3 & MongoDB'}
            {mode === 'register' && 'Join us to securely store and share your documents'}
            {mode === 'activate_pending' && 'We\'ve sent an activation link to your email'}
          </p>

          {mode === 'activate_pending' ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">
                A verification link has been sent to <strong>{email}</strong>.
                <br /><br />
                Please check your email and click the link to activate your account.
              </div>
              <button
                onClick={() => setMode('login')}
                className="w-full text-blue-600 font-medium py-2 text-sm"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">First Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        required
                        type="text"
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Last Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        required
                        type="text"
                        placeholder="Doe"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    required
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Password</label>
                    {mode === 'login' && (
                      <Link
                        to="/forgot-password"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Forgot?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-blue-200 transition duration-200 transform active:scale-95 flex items-center justify-center gap-2"
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </button>

              <div className="pt-4 text-center">
                <p className="text-sm text-gray-500">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="ml-2 text-blue-600 font-semibold hover:underline"
                  >
                    {mode === 'login' ? 'Register Now' : 'Sign In'}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

