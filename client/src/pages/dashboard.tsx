import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useLocation } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { useState } from 'react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!user) {
    setLocation('/auth');
    return null;
  }

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
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
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start upgrade process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (user.usage.limit === -1) return 0; // Unlimited
    return (user.usage.currentUsage / user.usage.limit) * 100;
  };

  const getPlanStatus = () => {
    if (user.subscription?.status === 'active') {
      return { text: 'Active', variant: 'default' as const };
    } else if (user.subscription?.status === 'past_due') {
      return { text: 'Past Due', variant: 'destructive' as const };
    } else if (user.subscription?.status === 'inactive') {
      return { text: 'Inactive', variant: 'secondary' as const };
    } else {
      return { text: 'Free Plan', variant: 'outline' as const };
    }
  };

  const planStatus = getPlanStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.user.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
              >
                Return to site
              </Button>
              <Button 
                variant="ghost" 
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{user.user.firstName} {user.user.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{user.user.email}</p>
                  </div>
                  {user.user.businessName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business</label>
                      <p className="text-gray-900">{user.user.businessName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Status</label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.user.emailVerified ? 'default' : 'destructive'}>
                        {user.user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity / Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump back to creating visualizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setLocation('/pools')} 
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-1">🏊</span>
                    Pool Design
                  </Button>
                  <Button 
                    onClick={() => setLocation('/landscape')} 
                    className="h-20 flex flex-col items-center justify-center"
                    variant="outline"
                  >
                    <span className="text-2xl mb-1">🌿</span>
                    Landscape
                  </Button>
                  <Button 
                    onClick={() => setLocation('/')} 
                    className="h-20 flex flex-col items-center justify-center"
                    variant="outline"
                  >
                    <span className="text-2xl mb-1">🏠</span>
                    Roofing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription & Usage */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{user.usage.planName}</span>
                  <Badge variant={planStatus.variant}>{planStatus.text}</Badge>
                </div>

                {user.subscription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Next Billing</label>
                    <p className="text-gray-900">
                      {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>
                  {user.usage.limit === -1 
                    ? 'Unlimited visualizations' 
                    : `${user.usage.currentUsage} of ${user.usage.limit} visualizations used`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.usage.limit !== -1 && (
                  <div>
                    <Progress value={getUsagePercentage()} className="w-full" />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>{user.usage.currentUsage} used</span>
                      <span>{user.usage.limit} total</span>
                    </div>
                  </div>
                )}

                {!user.subscription && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      You're on the free plan. Upgrade for more visualizations and features!
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleUpgrade('price_1S5X1sBY2SPm2HvOuDHNzsIp')}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                      >
                        Upgrade to Basic ($29/mo)
                      </Button>
                      <Button 
                        onClick={() => handleUpgrade('price_1S6De0BY2SPm2HvOX1t23IUg')}
                        disabled={loading}
                        className="w-full"
                      >
                        Upgrade to Pro ($99/mo)
                      </Button>
                    </div>
                  </div>
                )}

                {user.subscription?.planId === 'price_1S5X1sBY2SPm2HvOuDHNzsIp' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Upgrade to Pro for unlimited visualizations and embed features!
                    </p>
                    <Button 
                      onClick={() => handleUpgrade('price_1S6De0BY2SPm2HvOX1t23IUg')}
                      disabled={loading}
                      className="w-full"
                    >
                      Upgrade to Pro ($99/mo)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Warning */}
            {!user.usage.canUse && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Usage Limit Reached</CardTitle>
                  <CardDescription>
                    You've used all {user.usage.limit} visualizations for this month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleUpgrade('price_1S5X1sBY2SPm2HvOuDHNzsIp')}
                    disabled={loading}
                    className="w-full"
                  >
                    Upgrade to Continue
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}