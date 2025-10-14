import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function JoinTeam() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

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
      const res = await apiRequest("/api/teams/join-with-code", {
        method: "POST",
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to join team",
          variant: "destructive"
        });
        return;
      }

      setJoined(true);
      toast({
        title: "Success!",
        description: "You've joined the team successfully"
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
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

  if (joined) {
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
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Join a Team</CardTitle>
          <CardDescription className="text-center">
            Enter the join code you received in your invitation email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="joinCode" className="text-sm font-medium text-gray-700">
                Join Code
              </label>
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
                The join code is case-insensitive and was included in your invitation email
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

            <Button 
              type="button"
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate("/dashboard")}
              data-testid="button-back-to-dashboard"
            >
              Back to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
