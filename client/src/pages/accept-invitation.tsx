import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface InvitationDetails {
  email: string;
  teamName: string;
  role: string;
}

export default function AcceptInvitation() {
  const [, params] = useRoute("/accept-invitation");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Get token from URL
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        if (!res.ok) {
          const error = await res.json();
          toast({
            title: "Invalid invitation",
            description: error.error || "This invitation link is invalid or has expired",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }

        const data = await res.json();
        setInvitation(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load invitation details",
          variant: "destructive"
        });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, navigate, toast]);

  const handleAcceptInvitation = async () => {
    if (!token || !user) return;

    setAccepting(true);
    try {
      // Get the auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'Content-Type': 'application/json'
        },
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to accept invitation",
          variant: "destructive"
        });
        return;
      }

      setAccepted(true);
      toast({
        title: "Success!",
        description: "You've joined the team successfully"
      });

      // Redirect to dashboard after success
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the team!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Team Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Team:</span>
              <span className="text-sm font-semibold text-gray-900">{invitation.teamName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Your email:</span>
              <span className="text-sm font-semibold text-gray-900">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Role:</span>
              <span className="text-sm font-semibold text-gray-900 capitalize">{invitation.role}</span>
            </div>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Sign in or create an account to accept this invitation
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate(`/auth?redirect=/accept-invitation?token=${token}`)}
                data-testid="button-signin-to-accept"
              >
                Sign In or Sign Up
              </Button>
              <p className="text-xs text-gray-500 text-center">
                You can use any email address - the invitation will be updated to your account
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.user.email.toLowerCase() !== invitation.email.toLowerCase() && (
                <p className="text-sm text-blue-600 text-center bg-blue-50 p-3 rounded-lg">
                  ℹ️ This invitation was sent to <strong>{invitation.email}</strong>, but will be accepted for your account (<strong>{user.user.email}</strong>)
                </p>
              )}
              <Button 
                className="w-full" 
                onClick={handleAcceptInvitation}
                disabled={accepting}
                data-testid="button-accept-invitation"
              >
                {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Invitation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
