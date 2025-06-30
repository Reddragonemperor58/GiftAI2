'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { resendConfirmation, isEmailConfirmed } from '@/lib/auth';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if user is not logged in, email is confirmed, or banner is dismissed
  if (!user || isEmailConfirmed(user) || dismissed) {
    return null;
  }

  const handleResendConfirmation = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resendConfirmation(user.email);
      setSuccess('Confirmation email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send confirmation email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-yellow-300 bg-yellow-50">
          <Mail className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div className="flex-1">
              <span className="font-medium text-yellow-800">Email verification required</span>
              <span className="text-yellow-700 ml-2">
                Please check your email and click the confirmation link to access all features.
              </span>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {success && (
                <div className="flex items-center gap-1 text-green-700 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-1 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              
              <Button
                onClick={handleResendConfirmation}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Resend
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setDismissed(true)}
                size="sm"
                variant="ghost"
                className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}