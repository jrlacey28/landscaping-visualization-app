import { useState } from 'react';
import { useLocation } from 'wouter';
import { Code2, Folder, LayoutDashboard, Loader2, Lock, RefreshCw, Users } from 'lucide-react';

import BugFeatureForm from '@/components/bug-feature-form';
import EmbedCodeGenerator from '@/components/embed-code-generator';
import SavedGenerations from '@/components/saved-generations';
import TeamManagement from '@/components/team-management';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const dashboardTabs = ['overview', 'projects', 'embed'] as const;
type DashboardTab = typeof dashboardTabs[number];

function getInitialDashboardTab(): DashboardTab {
  if (typeof window === 'undefined') return 'overview';

  const tab = new URLSearchParams(window.location.search).get('tab');
  return dashboardTabs.includes(tab as DashboardTab) ? (tab as DashboardTab) : 'overview';
}

function updateDashboardTabUrl(tab: DashboardTab) {
  const params = new URLSearchParams(window.location.search);

  if (tab === 'overview') {
    params.delete('tab');
  } else {
    params.set('tab', tab);
  }

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

export default function Dashboard() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getInitialDashboardTab());
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authLoading && !user) {
    setLocation('/auth');
    return null;
  }

  if (!user) {
    return null;
  }

  const handleUpgrade = async (planId: string) => {
    try {
      setCheckoutLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest(
        'POST',
        '/api/subscription/checkout',
        { planId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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
      const response = await apiRequest(
        'POST',
        '/api/subscription/cancel',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Subscription Canceled',
          description: 'Your subscription will be canceled at the end of the current billing period.',
        });
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

  const handleJoinTeam = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!joinCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a join code',
        variant: 'destructive',
      });
      return;
    }

    setJoining(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      const res = await apiRequest(
        'POST',
        '/api/teams/join-with-code',
        { joinCode: joinCode.trim().toUpperCase() },
        {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        },
      );

      if (!res.ok) {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to join team',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success!',
        description: "You've joined the team successfully. Refreshing...",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join team',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveTeam = async (teamId: number) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      const res = await apiRequest('DELETE', `/api/teams/${teamId}/leave`, undefined, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: "You've left the team",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to leave team',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave team',
        variant: 'destructive',
      });
    }
  };

  const handleTabChange = (value: string) => {
    const nextTab = dashboardTabs.includes(value as DashboardTab) ? (value as DashboardTab) : 'overview';
    setActiveTab(nextTab);
    updateDashboardTabUrl(nextTab);
  };

  const getUsagePercentage = () => {
    if (user.usage.limit === -1) return 0;
    return (user.usage.currentUsage / user.usage.limit) * 100;
  };

  const getPlanStatus = () => {
    if (user.subscription?.status === 'active') {
      return { text: 'Active', variant: 'default' as const };
    }

    if (user.subscription?.status === 'past_due') {
      return { text: 'Past Due', variant: 'destructive' as const };
    }

    if (user.subscription?.status === 'inactive') {
      return { text: 'Inactive', variant: 'secondary' as const };
    }

    return { text: 'Free Plan', variant: 'outline' as const };
  };

  const planStatus = getPlanStatus();
  const fallbackTenant = {
    id: 0,
    userId: user.workspaceOwnerId || user.user.id,
    slug: `user-${user.workspaceOwnerId || user.user.id}`,
    companyName: user.user.businessName || `${user.user.firstName} ${user.user.lastName}`,
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    phone: '',
    email: user.user.email,
    active: true,
  };
  const embedTenant = tenant && tenant.slug !== 'demo' ? tenant : fallbackTenant;
  const embedAccountUserId = user.workspaceOwnerId || user.user.id;
  const enterpriseTenant = user.enterpriseTenant;
  const enterpriseUsagePercentage = enterpriseTenant?.monthlyGenerationLimit
    ? ((enterpriseTenant.currentMonthGenerations || 0) / enterpriseTenant.monthlyGenerationLimit) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.user.firstName}!</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setLocation('/')}>
                Return to site
              </Button>
              <Button variant="ghost" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 bg-white p-1 shadow-sm lg:w-[520px]">
            <TabsTrigger value="overview" className="gap-2 py-2.5">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 py-2.5">
              <Folder className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-2 py-2.5">
              <Code2 className="h-4 w-4" />
              Embed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your account details and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-gray-900">
                          {user.user.firstName} {user.user.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="break-words text-gray-900">{user.user.email}</p>
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

                <TeamManagement userId={user.user.id} subscription={user.subscription} />

                {!user.hasBusinessProAccess && (!user.teams || user.teams.length === 0) && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>Join a Team</CardTitle>
                          <CardDescription>Have an invitation? Enter your join code</CardDescription>
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
                            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
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

                {user.teams && user.teams.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>Team Membership</CardTitle>
                          <CardDescription>You're part of a team</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user.teams.map((team: any) => (
                        <div key={team.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between gap-3">
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
                                onClick={() => handleLeaveTeam(team.id)}
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
                          ? 'Higher visualization amount'
                          : `${user.usage.currentUsage} of ${user.usage.limit} visualizations used`}
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
                            onClick={() => handleUpgrade('price_1TcynuBY2SPm2HvO1Eri2ogI')}
                            disabled={checkoutLoading}
                            className="w-full"
                          >
                            Upgrade to Contractor ($300/mo)
                          </Button>
                          <Button
                            onClick={() => handleUpgrade('price_1SGN4YBY2SPm2HvOrpREWCn1')}
                            disabled={checkoutLoading}
                            className="w-full"
                          >
                            Upgrade to Professional ($500/mo)
                          </Button>
                        </div>
                      </div>
                    )}

                    {user.subscription?.planId === 'price_1TcynuBY2SPm2HvO1Eri2ogI' &&
                      user.subscription?.status === 'active' && (
                        <div className="space-y-3 border-t pt-4">
                          <p className="text-sm text-gray-600">
                            You're on the Contractor plan with 200 visualizations/month!
                          </p>
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleUpgrade('price_1SGN4YBY2SPm2HvOrpREWCn1')}
                              disabled={checkoutLoading}
                              className="w-full"
                            >
                              Upgrade to Professional ($500/mo)
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
                          You have Professional access with 650 visualizations/month and team features!
                        </p>
                        <Button
                          onClick={handleCancel}
                          disabled={checkoutLoading}
                          className="w-full"
                          variant="destructive"
                        >
                          Cancel Plan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {enterpriseTenant && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enterprise Embed Usage</CardTitle>
                      <CardDescription>
                        Monthly quota for {enterpriseTenant.companyName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Embed generations</span>
                        <Badge variant={enterpriseTenant.embedEnabled ? 'default' : 'secondary'}>
                          {enterpriseTenant.embedEnabled ? 'Embed enabled' : 'Embed disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(enterpriseTenant.currentMonthGenerations || 0).toLocaleString()} of{' '}
                        {(enterpriseTenant.monthlyGenerationLimit || 0).toLocaleString()} visualizations used
                      </p>
                      <Progress value={Math.min(enterpriseUsagePercentage, 100)} className="w-full" />
                      {enterpriseTenant.embedRequireQuoteAfterLimit && (
                        <p className="text-xs text-gray-500">
                          Website visitors get {enterpriseTenant.embedVisitorLimit || 3} free visualizations before the quote prompt.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                        onClick={() => handleUpgrade('price_1TcynuBY2SPm2HvO1Eri2ogI')}
                        disabled={checkoutLoading}
                        className="w-full"
                      >
                        Upgrade to Continue
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <BugFeatureForm />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <SavedGenerations />
          </TabsContent>

          <TabsContent value="embed" className="mt-0">
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Embed Tools</h2>
                <p className="text-sm text-gray-600">Add visualization tools to your website</p>
              </div>

              {user.hasEmbedAccess ? (
                <EmbedCodeGenerator tenant={embedTenant} accountUserId={embedAccountUserId} />
              ) : (
                <Card>
                  <CardContent className="flex min-h-80 items-center justify-center p-8">
                    <div className="max-w-md text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <Lock className="h-7 w-7 text-gray-500" />
                      </div>
                      <h3 className="mb-2 font-semibold text-gray-900">Professional Feature Required</h3>
                      <p className="mb-5 text-sm text-gray-600">
                        Embed visualizers directly on your website for an interactive design experience.
                      </p>
                      <Button
                        onClick={() => handleUpgrade('price_1SGN4YBY2SPm2HvOrpREWCn1')}
                        disabled={checkoutLoading}
                        className="w-full max-w-xs"
                      >
                        Upgrade to Professional
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
