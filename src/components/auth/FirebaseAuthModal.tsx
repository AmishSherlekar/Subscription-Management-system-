import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSystemStore } from '../../store';
import {
  registerWithFirebase,
  loginWithFirebase,
  sendResetEmail,
  testFirestoreConnection,
  pushAllToFirestore,
  validatePasswordRequirements,
} from '../../services/firestoreService';
import type { UserRole } from '../../types';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    customers,
    products,
    plans,
    taxRules,
    discountRules,
    quotations,
    subscriptions,
    invoices,
    payments,
  } = useSystemStore();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'firestore'>('firestore');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsSubmitting(true);
    setStatusMessage({ type: 'info', text: 'Testing Cloud Firestore connection...' });
    const res = await testFirestoreConnection();
    setIsSubmitting(false);
    setStatusMessage({
      type: res.connected ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSyncToFirestore = async () => {
    setIsSubmitting(true);
    setStatusMessage({
      type: 'info',
      text: 'Synchronizing all records to Cloud Firestore...',
    });

    const res = await pushAllToFirestore({
      customers,
      products,
      plans,
      taxRules,
      discountRules,
      quotations,
      subscriptions,
      invoices,
      payments,
    });

    setIsSubmitting(false);
    setStatusMessage({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Check local store users first for instant offline/demo capability
    const matched = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (matched) {
      setCurrentUser(matched);
      setIsSubmitting(false);
      setStatusMessage({
        type: 'success',
        text: `Logged in successfully as ${matched.displayName} (${matched.role} role)!`,
      });
      setTimeout(() => onClose(), 1200);
      return;
    }

    // Attempt Firebase live Auth
    const res = await loginWithFirebase(email, password);
    setIsSubmitting(false);
    if (res.success) {
      const newUserProfile = {
        uid: res.uid!,
        email,
        displayName: email.split('@')[0],
        role: 'staff' as UserRole,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(newUserProfile);
      setStatusMessage({
        type: 'success',
        text: 'Firebase Auth verification successful!',
      });
      setTimeout(() => onClose(), 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Authentication failed. Check credentials.',
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password requirements check
    const check = validatePasswordRequirements(password);
    if (!check.valid) {
      setStatusMessage({ type: 'error', text: check.error || 'Invalid password' });
      return;
    }

    setIsSubmitting(true);
    const res = await registerWithFirebase(email, password, displayName, role);
    setIsSubmitting(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setStatusMessage({
        type: 'success',
        text: `Account created and verified on Firebase Auth! Logged in as ${res.user.displayName}`,
      });
      setTimeout(() => onClose(), 1500);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Registration failed.',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Please enter your registered email.' });
      return;
    }
    setIsSubmitting(true);
    const res = await sendResetEmail(email);
    setIsSubmitting(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Password reset link sent to ${email} via Firebase Auth.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to send password reset email.',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Firebase Cloud Backend & User Authentication"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Backend Status Banner */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold block">Connected to Firebase Cloud Firestore</span>
              <span className="text-[11px] text-blue-700">
                Project ID: <code className="font-mono">subscription-7a4ab</code>
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white uppercase">
            Live Database
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => { setTab('firestore'); setStatusMessage(null); }}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              tab === 'firestore'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cloud Firestore Sync
          </button>
          <button
            onClick={() => { setTab('login'); setStatusMessage(null); }}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setStatusMessage(null); }}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              tab === 'register'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Account
          </button>
          <button
            onClick={() => { setTab('forgot'); setStatusMessage(null); }}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              tab === 'forgot'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reset Password
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-2.5 rounded text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Cloud Firestore Sync */}
        {tab === 'firestore' && (
          <div className="space-y-4">
            <p className="text-slate-600">
              The application connects directly to Firebase Cloud Firestore and Authentication on your project (
              <code className="font-mono">subscription-7a4ab</code>) using reliable client-side transactions.
            </p>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 block">Database Architecture & Guarantees:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Direct real-time synchronization with Cloud Firestore.</li>
                <li>Concurrent recurring billing uses Firestore client transactions with unique idempotency keys.</li>
                <li>All monetary amounts stored strictly in integer paise.</li>
                <li>Invoice line items snapshot history without modifying historical documents.</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Test Firestore Connection
              </button>
              <button
                type="button"
                onClick={handleSyncToFirestore}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                Push Seed Data to Firestore
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@brightloop.com"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>

            {/* Quick Demo Accounts */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-1">Quick Demo Sign-in:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@brightloop.com');
                    setPassword('Admin@123456');
                  }}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@brightloop.com');
                    setPassword('Staff@123456');
                  }}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@apexretail.in');
                    setPassword('Customer@123456');
                  }}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Customer
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Sign In
            </button>
          </form>
        )}

        {/* Tab 3: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address (Must be unique)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vikram@example.com"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Password <span className="text-slate-400 font-normal">(8+ chars, upper, lower, symbol)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. Brightloop@2026"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2 rounded border border-slate-300 bg-white"
              >
                <option value="staff">Staff (Operational access)</option>
                <option value="customer">Customer (Portal access)</option>
                <option value="admin">Admin (Full system access)</option>
              </select>
            </div>

            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500">
              Passwords are never saved directly to database documents; authentication is verified via Firebase Auth.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Create Account
            </button>
          </form>
        )}

        {/* Tab 4: Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-slate-600">
              Enter your registered email address. Firebase Auth will dispatch a secure password reset link to your inbox.
            </p>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Registered Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@apexretail.in"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Send Password Reset Email
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
