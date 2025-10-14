import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/use-tenant';
import EmbedCodeGenerator from '@/components/embed-code-generator';
import BugFeatureForm from '@/components/bug-feature-form';
import TeamManagement from '@/components/team-management';
import { RefreshCw, ChevronDown, ChevronUp, Users, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Dashboard() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [embedToolsOpen, setEmbedToolsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { tenant } = useTenant("demo");

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
      toast({
        title: 'Success',
        description: 'Your account information has been refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh account information',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect to auth if we're not loading and there's no user
  if (!authLoading && !user) {
    setLocation('/auth');
    return null;
  }

  // Ensure user is not null for the rest of the component
  if (!user) {
    return null;
  }

  const handleUpgrade = async (planId: string) => {
    try {
      setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCheckoutLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('POST', '/api/subscription/cancel', 
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Subscription Canceled',
          description: 'Your subscription will be canceled at the end of the current billing period.',
        });
        // Refresh user data to reflect changes
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a join code",
        variant: "destructive"
      });
      return;
    }

    setJoining(true);
    try {
      // Get the auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      
      const res = await apiRequest('POST', '/api/teams/join-with-code', 
        { joinCode: joinCode.trim().toUpperCase() },
        { 
          headers: {
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        }
      );

      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to join team",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success!",
        description: "You've joined the team successfully. Refreshing..."
      });

      // Refresh the page to show updated team info
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join team",
        variant: "destructive"
      });
    } finally {
      setJoining(false);
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

            <Collapsible open={embedToolsOpen} onOpenChange={setEmbedToolsOpen}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Embed Tools</CardTitle>
                      <CardDescription>Add visualization tools to your website</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid="button-toggle-embed">
                        {embedToolsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    {user.hasEmbedAccess ? (
                      <EmbedCodeGenerator tenant={tenant || {
                        id: 0,
                        slug: `user-${user.user.id}`,
                        companyName: user.user.businessName || `${user.user.firstName} ${user.user.lastName}`,
                        primaryColor: "#10b981",
                        secondaryColor: "#059669",
                        phone: "",
                        email: user.user.email,
                        active: true,
                      }} />
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="text-6xl opacity-50">🔒</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Pro Feature Required</h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Embed our visualization tools directly on your website to provide your customers with an interactive design experience.
                          </p>
                          <Button 
                            onClick={() => handleUpgrade('price_1SGN4YBY2SPm2HvOrpREWCn1')}
                            disabled={checkoutLoading}
                            className="w-full max-w-xs"
                          >
                            Upgrade to Business Pro
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Team Management - Business Pro Feature */}
            <TeamManagement 
              userId={user.user.id} 
              subscription={user.subscription}
            />

            {/* Join a Team Card - Only show if NOT Business Pro and NOT in a team */}
            {!user.hasBusinessProAccess && 
             (!user.teams || user.teams.length === 0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Join a Team</CardTitle>
                      <CardDescription>
                        Have an invitation? Enter your join code
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoinTeam} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        id="joinCode"
                        type="text"
                        placeholder="Enter 8-character code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="text-center text-lg font-mono tracking-widest uppercase"
                        data-testid="input-join-code"
                      />
                      <p className="text-xs text-gray-500">
                        The join code is included in your team invitation email
                      </p>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full" 
                      disabled={joining || !joinCode.trim()}
                      data-testid="button-join-team"
                    >
                      {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Join Team
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
            
            {/* Team Membership Card - Show if user is in a team */}
            {user.teams && user.teams.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Team Membership</CardTitle>
                      <CardDescription>
                        You're part of a team
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.teams.map((team: any) => (
                    <div key={team.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{team.name}</h4>
                          <p className="text-sm text-gray-500">
                            {team.ownerId === user.user.id ? 'Owner' : 'Member'}
                          </p>
                        </div>
                        {team.ownerId !== user.user.id && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const authToken = localStorage.getItem('auth_token');
                                const res = await apiRequest('DELETE', `/api/teams/${team.id}/leave`, 
                                  undefined,
                                  { 
                                    headers: {
                                      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                                    }
                                  }
                                );
                                
                                if (res.ok) {
                                  toast({
                                    title: "Success",
                                    description: "You've left the team"
                                  });
                                  setTimeout(() => window.location.reload(), 1500);
                                } else {
                                  const error = await res.json();
                                  toast({
                                    title: "Error",
                                    description: error.error || "Failed to leave team",
                                    variant: "destructive"
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to leave team",
                                  variant: "destructive"
                                });
                              }
                            }}
                            data-testid={`button-leave-team-${team.id}`}
                          >
                            Leave Team
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan & Usage</CardTitle>
                    <CardDescription>Your subscription and monthly usage details</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Refresh account information"
                    data-testid="button-refresh-account"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
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

                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Usage This Month</label>
                  <p className="text-sm text-gray-600 mb-3">
                    {user.usage.limit === -1 
                      ? 'Unlimited visualizations' 
                      : `${user.usage.currentUsage} of ${user.usage.limit} visualizations used`
                    }
                  </p>
                  
                  {user.usage.limit !== -1 && (
                    <div>
                      <Progress value={getUsagePercentage()} className="w-full" />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>{user.usage.currentUsage} used</span>
                        <span>{user.usage.limit} total</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {!user.subscription && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-gray-600">
                      You're on the free plan. Upgrade for more visualizations and features!
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleUpgrade('price_1S5X2XBY2SPm2HvO2he9Unto')}
                        disabled={checkoutLoading}
                        className="w-full"
                      >
                        Upgrade to Contractor ($100/mo)
                      </Button>
                      <Button 
                        onClick={() => handleUpgrade('price_1SGN4YBY2SPm2HvOrpREWCn1')}
                        disabled={checkoutLoading}
                        className="w-full"
                        variant="default"
                      >
                        Upgrade to Business Pro ($300/mo)
                      </Button>
                    </div>
                  </div>
                )}

                {user.subscription?.planId === 'price_1S5X2XBY2SPm2HvO2he9Unto' && user.subscription?.status === 'active' && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-gray-600">
                      You're on the Contractor plan with 100 visualizations/month!
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleUpgrade('price_1SGN4YBY2SPm2HvOrpREWCn1')}
                        disabled={checkoutLoading}
                        className="w-full"
                      >
                        Upgrade to Business Pro ($300/mo)
                      </Button>
                      <Button 
                        onClick={handleCancel}
                        disabled={checkoutLoading}
                        className="w-full"
                        variant="destructive"
                      >
                        Cancel Plan
                      </Button>
                    </div>
                  </div>
                )}

                {user.hasBusinessProAccess && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-gray-600">
                      You have Business Pro access with 500 visualizations/month and team features!
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleCancel}
                        disabled={checkoutLoading}
                        className="w-full"
                        variant="destructive"
                      >
                        Cancel Plan
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

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
                    onClick={() => handleUpgrade('price_1S5X2XBY2SPm2HvO2he9Unto')}
                    disabled={checkoutLoading}
                    className="w-full"
                  >
                    Upgrade to Continue
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bug/Feature Request Form */}
            <BugFeatureForm />
          </div>
        </div>
      </div>
    </div>
  );
}