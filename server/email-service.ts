import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

interface SendTeamInvitationEmailParams {
  toEmail: string;
  teamName: string;
  inviterName: string;
  invitationLink?: string;
}

export async function sendTeamInvitationEmail({
  toEmail,
  teamName,
  inviterName,
  invitationLink
}: SendTeamInvitationEmailParams): Promise<boolean> {
  try {
    // Use onboarding@resend.dev for testing, or configure your verified domain
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    // Get the app URL from Replit domains (works for both dev and production)
    const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
    const appUrl = replitDomain 
      ? `https://${replitDomain}`
      : 'http://localhost:5000';
    
    const loginLink = invitationLink || `${appUrl}/auth`;
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `You've been invited to join ${teamName} on DreamBuilder`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Team Invitation</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on DreamBuilder.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                DreamBuilder is a landscaping visualization platform that helps you create stunning designs using AI technology.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If you don't have an account yet, you'll be able to create one after clicking the button above.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #999; text-align: center;">
                This invitation was sent to ${toEmail}. If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `You've been invited to join ${teamName} on DreamBuilder!
      
${inviterName} has invited you to collaborate on their team.

Click here to accept the invitation and get started:
${loginLink}

If you don't have an account yet, you'll be able to create one after clicking the link above.

This invitation was sent to ${toEmail}. If you weren't expecting this invitation, you can safely ignore this email.`
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('✅ Team invitation email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send team invitation email:', error);
    return false;
  }
}
