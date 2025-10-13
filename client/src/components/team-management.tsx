import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, X, Users, Crown, User } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TeamMember {
  id: number;
  email: string;
  role: string;
  status: string;
  joinedAt?: Date;
}

interface Team {
  id: number;
  name: string;
  ownerId: number;
  maxMembers: number;
  additionalSeats: number;
}

interface TeamManagementProps {
  userId: number;
  subscription?: any;
}

export default function TeamManagement({ userId, subscription }: TeamManagementProps) {
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Check if user has Business Pro subscription
  const hasBusinessPro = subscription?.planId === 'price_1SGN4YBY2SPm2HvOrpREWCn1' && 
                         subscription?.status === 'active';

  useEffect(() => {
    if (hasBusinessPro) {
      fetchTeam();
    } else {
      setLoading(false);
    }
  }, [hasBusinessPro]);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/teams/my-team', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team);
        setMembers(data.members || []);
      } else if (response.status === 404) {
        // No team exists yet
        setTeam(null);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a team name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreatingTeam(true);
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('POST', '/api/teams', 
        { name: teamName },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      if (response.ok) {
        setTeam(data.team);
        setTeamName('');
        toast({
          title: 'Success',
          description: 'Team created successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to create team');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive'
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('POST', `/api/teams/${team?.id}/invite`, 
        { email: inviteEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      if (response.ok) {
        setMembers([...members, data.member]);
        setInviteEmail('');
        setInviteOpen(false);
        toast({
          title: 'Success',
          description: `Invitation sent to ${inviteEmail}`,
        });
      } else {
        throw new Error(data.error || 'Failed to invite member');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite member',
        variant: 'destructive'
      });
    }
  };

  const removeMember = async (memberId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('DELETE', `/api/teams/${team?.id}/members/${memberId}`, 
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberId));
        toast({
          title: 'Success',
          description: 'Team member removed',
        });
      } else {
        throw new Error('Failed to remove member');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  if (!hasBusinessPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Upgrade to Business Pro to manage team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Business Pro includes team collaboration features for up to 3 users
            </p>
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="bg-gradient-to-r from-purple-600 to-purple-700"
            >
              Upgrade to Business Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading team information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Team</CardTitle>
          <CardDescription>Set up your team to collaborate on projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="Enter your team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={createTeam}
              disabled={creatingTeam}
              className="w-full"
            >
              {creatingTeam ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSlots = (team.maxMembers || 3) + (team.additionalSeats || 0);
  const usedSlots = members.length + 1; // +1 for owner

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{team.name}</CardTitle>
            <CardDescription>
              {usedSlots} of {totalSlots} team members
            </CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={usedSlots >= totalSlots}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button onClick={inviteMember} className="w-full">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Team Owner */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">You (Owner)</p>
                <p className="text-sm text-gray-600">Full access</p>
              </div>
            </div>
            <Badge>Owner</Badge>
          </div>

          {/* Team Members */}
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{member.email}</p>
                  <p className="text-sm text-gray-600">
                    {member.status === 'pending' ? 'Invitation pending' : 'Active member'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={member.status === 'pending' ? 'secondary' : 'default'}>
                  {member.status}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeMember(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add more seats */}
          {usedSlots >= totalSlots && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">
                Need more team members? Add additional seats for $50/month each.
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = '/pricing'}
              >
                Add More Seats
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}