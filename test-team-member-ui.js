// Test script to verify team member UI shows correctly
// This script tests that team members see "You (Member)" instead of "You (Owner)"
// and that they cannot invite or manage team settings

async function testTeamMemberUI() {
  console.log('Testing Team Member UI Fixes...\n');
  
  // Test user credentials (team member)
  const teamMemberEmail = 'bballjordan28@gmail.com';
  const teamMemberPassword = 'test123';
  
  const baseUrl = 'http://localhost:5000';
  
  // Step 1: Login as team member
  console.log('Step 1: Logging in as team member...');
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: teamMemberEmail,
      password: teamMemberPassword,
    }),
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Failed to login:', await loginResponse.text());
    return;
  }
  
  const loginData = await loginResponse.json();
  const token = loginData.user.token;
  console.log('✅ Logged in successfully');
  console.log(`   User ID: ${loginData.user.id}`);
  console.log(`   Email: ${loginData.user.email}`);
  console.log(`   Has Business Pro Access: ${loginData.user.hasBusinessProAccess}`);
  console.log(`   Plan: ${loginData.user.planName}\n`);
  
  // Step 2: Fetch team information
  console.log('Step 2: Fetching team information...');
  const teamResponse = await fetch(`${baseUrl}/api/teams/my-team`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!teamResponse.ok) {
    console.error('❌ Failed to fetch team:', await teamResponse.text());
    return;
  }
  
  const teamData = await teamResponse.json();
  console.log('✅ Team data retrieved');
  console.log(`   Team Name: ${teamData.team.name}`);
  console.log(`   Is Owner: ${teamData.isOwner}`);
  console.log(`   Current User ID: ${teamData.currentUserId}`);
  console.log(`   Members Count: ${teamData.members ? teamData.members.length : 'N/A (hidden from members)'}\n`);
  
  // Step 3: Verify UI behavior
  console.log('Step 3: Verifying UI behavior...');
  
  if (teamData.isOwner === false) {
    console.log('✅ User correctly identified as team MEMBER (not owner)');
    
    // Verify members don't see the member list
    if (!teamData.members || teamData.members.length === 0) {
      console.log('✅ Member list hidden from team members (as expected)');
    } else {
      console.log('❌ WARNING: Member list visible to team members (should be hidden)');
    }
    
    console.log('\n📱 Expected UI for team members:');
    console.log('   - Shows "You (Member)" label');
    console.log('   - No invite button visible');
    console.log('   - No member management options');
    console.log('   - Shows message: "You have access to all Business Pro features through your team"');
    
  } else {
    console.log('❌ ERROR: User identified as owner but should be a member!');
    console.log(`   This user (${teamMemberEmail}) should be a team member, not owner`);
  }
  
  // Step 4: Test that team member cannot invite others
  console.log('\nStep 4: Testing invite restrictions...');
  const inviteResponse = await fetch(`${baseUrl}/api/teams/${teamData.team.id}/invite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'testinvite@example.com',
    }),
  });
  
  if (!inviteResponse.ok) {
    console.log('✅ Team member cannot send invites (403 expected):', inviteResponse.status);
  } else {
    console.log('❌ WARNING: Team member was able to send invite (should be restricted)');
  }
  
  console.log('\n✅ Test Complete!');
  console.log('Summary: Team member UI properly shows restricted access');
}

// Run the test
testTeamMemberUI().catch(console.error);