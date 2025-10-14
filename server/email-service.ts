import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

interface SendTeamInvitationEmailParams {
  toEmail: string;
  teamName: string;
  inviterName: string;
  invitationLink?: string;
  joinCode?: string;
}

export async function sendTeamInvitationEmail({
  toEmail,
  teamName,
  inviterName,
  invitationLink,
  joinCode
}: SendTeamInvitationEmailParams): Promise<boolean> {
  try {
    // Use onboarding@resend.dev for testing, or configure your verified domain
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    // Use production domain if set, otherwise fall back to Replit domains
    const productionUrl = process.env.APP_URL || process.env.PRODUCTION_URL;
    const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
    const appUrl = productionUrl 
      ? productionUrl 
      : (replitDomain ? `https://${replitDomain}` : 'http://localhost:5000');
    
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
            <title>Team Invitation - DreamBuilder</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #000000 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                    
                    <!-- Header with Logo -->
                    <tr>
                      <td align="center" style="padding: 48px 40px 32px 40px;">
                        <img src="${appUrl}/DreamBuilder%20White%20Transparent%20Logo_1759527781128.png" alt="DreamBuilder" style="height: 60px; width: auto; display: block;" />
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border-radius: 12px; padding: 32px; border: 1px solid rgba(255, 255, 255, 0.1);">
                              
                              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                You've Been Invited!
                              </h1>
                              
                              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                                <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join their team on <strong style="color: #ffffff;">DreamBuilder</strong>
                              </p>
                              
                              <div style="background: rgba(0, 86, 179, 0.15); border-left: 4px solid #0056B3; padding: 16px; margin: 24px 0; border-radius: 6px;">
                                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0;">
                                  <strong style="color: #ffffff; display: block; margin-bottom: 8px;">Team: ${teamName}</strong>
                                  Join your team to collaborate on AI-powered visualization projects for landscaping, roofing, siding, pools, and more.
                                </p>
                              </div>
                              
                              <!-- CTA Button -->
                              <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginLink}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #0056B3 0%, #003d82 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);">
                                  Accept Invitation →
                                </a>
                              </div>
                              
                              <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                                New to DreamBuilder? You'll be able to create your account after clicking above.
                              </p>
                              
                              ${joinCode ? `
                              <!-- Join Code Section -->
                              <div style="background: rgba(255, 255, 255, 0.08); border: 2px solid rgba(0, 86, 179, 0.4); border-radius: 12px; padding: 24px; margin: 32px 0 0 0; text-align: center;">
                                <p style="color: #cbd5e1; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Alternative Method
                                </p>
                                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">
                                  Already have an account? Enter this join code:
                                </p>
                                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; display: inline-block; margin: 0 0 12px 0;">
                                  <code style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #60a5fa;">
                                    ${joinCode}
                                  </code>
                                </div>
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                  Enter this code on the team join page while signed in
                                </p>
                              </div>
                              ` : ''}
                              
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
                              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                                This invitation was sent to <span style="color: #94a3b8;">${toEmail}</span><br/>
                                If you weren't expecting this, you can safely ignore this email.
                              </p>
                              <p style="color: #475569; font-size: 11px; margin: 16px 0 0 0; text-align: center;">
                                © ${new Date().getFullYear()} DreamBuilder AI. All rights reserved.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
╔══════════════════════════════════════════════════════════════╗
║                       DREAMBUILDER AI                         ║
║                    Team Invitation                            ║
╚══════════════════════════════════════════════════════════════╝

You've Been Invited!

${inviterName} has invited you to join their team on DreamBuilder.

Team: ${teamName}
Join your team to collaborate on AI-powered visualization projects 
for landscaping, roofing, siding, pools, and more.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accept Your Invitation:
${loginLink}

New to DreamBuilder? You'll be able to create your account after 
clicking the link above.

${joinCode ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTERNATIVE METHOD
Already have an account? Enter this join code:

    ${joinCode}

Enter this code on the team join page while signed in.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

This invitation was sent to ${toEmail}
If you weren't expecting this, you can safely ignore this email.

© ${new Date().getFullYear()} DreamBuilder AI. All rights reserved.`
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
