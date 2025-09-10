import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get plan from URL params for direct checkout
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan');
  const token = urlParams.get('token');
  const error = urlParams.get('error');

  // Handle Google OAuth callback
  useEffect(() => {
    console.log('🔍 Auth useEffect triggered - Token:', token, 'Error:', error);
    
    if (token) {
      console.log('✅ Found token, processing...');
      // Store the token and refresh user data
      localStorage.setItem('auth_token', token);
      
      // Refresh user data from auth context
      refreshUser().then(() => {
        if (planId) {
          redirectToCheckout(planId);
        } else {
          setLocation('/dashboard');
        }
        
        toast({
          title: 'Success',
          description: 'Signed in with Google successfully!',
        });
      }).catch((error) => {
        console.error('Failed to refresh user after OAuth:', error);
        toast({
          title: 'Error',
          description: 'Authentication failed. Please try signing in again.',
          variant: 'destructive',
        });
      });
    } else if (error) {
      let errorMessage = 'Authentication failed';
      if (error === 'google_auth_failed') {
        errorMessage = 'Google authentication failed. Please try again.';
      } else if (error === 'callback_failed') {
        errorMessage = 'Authentication callback failed. Please try again.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [token, error, planId]); // Removed setLocation, toast, refreshUser to prevent infinite re-renders

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setIsLoading(true);
      await login(email, password);
      
      // If we have a plan ID, redirect to checkout
      if (planId) {
        await redirectToCheckout(planId);
      } else {
        setLocation('/dashboard');
      }
      
      toast({
        title: 'Success',
        description: 'Logged in successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      businessName: formData.get('businessName') as string,
      phone: formData.get('phone') as string,
    };

    try {
      setIsLoading(true);
      await register(data);
      
      // If we have a plan ID, redirect to checkout
      if (planId) {
        await redirectToCheckout(planId);
      } else {
        setLocation('/dashboard');
      }
      
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToCheckout = async (planId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('POST', '/api/subscription/checkout', 
        { planId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to redirect to checkout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignIn = () => {
    const redirectUrl = planId 
      ? `/api/auth/google?plan=${encodeURIComponent(planId)}`
      : '/api/auth/google';
    window.location.href = redirectUrl;
  };

  const getPlanName = (planId: string) => {
    if (planId === 'price_1S5X1sBY2SPm2HvOuDHNzsIp') return 'Basic Plan';
    if (planId === 'price_1S5X2XBY2SPm2HvO2he9Unto') return 'Pro Plan';
    return 'Selected Plan';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {planId ? `Sign up for ${getPlanName(planId)}` : 'Welcome to DreamBuilder'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {planId ? 'Create your account to continue to checkout' : 'Sign in to your account or create a new one'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              {planId ? 'Sign up to purchase your plan' : 'Access your visualization dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google OAuth Button */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading || loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue={planId ? 'register' : 'login'} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Enter your password"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || loading}
                  >
                    {isLoading || loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Create a strong password"
                      minLength={8}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name (Optional)</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Your Business Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || loading}
                  >
                    {isLoading || loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}