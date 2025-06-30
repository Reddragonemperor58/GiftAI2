'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Home } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback from URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for errors first
        if (error) {
          throw new Error(errorDescription || error);
        }

        // Handle different callback types
        if (type === 'recovery') {
          // This is a password reset callback - redirect to reset password page
          if (accessToken && refreshToken) {
            // Set the session for password reset
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              throw sessionError;
            }

            // Redirect to password reset page
            router.push('/auth/reset-password');
            return;
          } else {
            throw new Error('Invalid password reset link');
          }
        } else if (type === 'signup' || accessToken) {
          // This is an email confirmation callback
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              throw sessionError;
            }

            setSuccess(true);
            // Redirect to home page after successful email confirmation
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else {
            throw new Error('Invalid confirmation link');
          }
        } else {
          // Check if we have an existing session
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            setSuccess(true);
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else {
            // No session and no callback parameters - redirect to home
            router.push('/');
          }
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Processing your request...</h2>
                <p className="text-gray-600 mt-2">Please wait while we verify your information.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Authentication Failed
            </CardTitle>
            <CardDescription>
              There was a problem processing your request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                This could be due to an expired or invalid link. Please try requesting a new one.
              </p>
              
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Success!
            </CardTitle>
            <CardDescription>
              Your request has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Welcome to GiftAI! You can now access all features and save your gift searches.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">Redirecting you to the home page...</p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}