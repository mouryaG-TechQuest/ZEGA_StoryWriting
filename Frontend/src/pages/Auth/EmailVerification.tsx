import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import authService from '../../api/auth.service';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      
      if (response.verified) {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setStatus('error');
      setMessage('Verification failed. The link may be expired or invalid.');
    }
  }, [navigate]);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setTimeout(() => {
        setStatus('error');
        setMessage('Invalid verification link');
      }, 0);
      return;
    }

    // Wrap in timeout to avoid synchronous setState in effect
    setTimeout(() => {
      void verifyEmail(token);
    }, 0);
  }, [searchParams, verifyEmail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-purple-100">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying Email</h1>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition font-semibold"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
