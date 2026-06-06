import { Resend } from 'resend';
import type { Lead, Tenant } from '@shared/schema';

const resendApiKey = process.env.RESEND_API || process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type EmailAttachment = {
  filename?: string | false;
  content?: Buffer;
  contentType?: string;
  path?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSelectedStyles(selectedStyles: unknown) {
  if (!selectedStyles) return "Not provided";

  if (typeof selectedStyles === "string") return selectedStyles;

  try {
    return JSON.stringify(selectedStyles, null, 2);
  } catch {
    return "Provided";
  }
}

function imageAttachmentFromUrl(imageUrl?: string | null): EmailAttachment | null {
  if (!imageUrl) return null;

  const dataUrlMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const [, contentType, base64] = dataUrlMatch;
    const buffer = Buffer.from(base64, "base64");

    // Resend supports 40MB per email. Keep this comfortably below that.
    if (buffer.byteLength > 30 * 1024 * 1024) {
      console.warn("Generated quote image is too large to attach; email will include lead details only.");
      return null;
    }

    const extension = contentType.includes("png") ? "png" : "jpg";
    return {
      filename: `generated-design.${extension}`,
      content: buffer,
      contentType,
    };
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return {
      filename: "generated-design.jpg",
      path: imageUrl,
    };
  }

  return null;
}

function imageReferenceNote(label: string, imageUrl?: string | null) {
  if (!imageUrl) return `No ${label} image was provided.`;
  if (imageUrl.startsWith("data:image/")) {
    return `${label} image is saved in the dashboard lead record.`;
  }
  return `${label} image: ${imageUrl}`;
}

export async function sendQuoteLeadNotificationEmail({
  tenant,
  lead,
  toEmail,
}: {
  tenant: Tenant;
  lead: Lead;
  toEmail: string;
}): Promise<boolean> {
  try {
    if (!resend) {
      console.warn("RESEND_API is not configured; skipping quote lead email.");
      return false;
    }

    if (!toEmail) {
      console.warn("No quote lead recipient email configured; skipping quote lead email.");
      return false;
    }

    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const fullName = `${lead.firstName} ${lead.lastName}`.trim();
    const generatedImageAttachment = tenant.embedQuoteIncludeImages === false
      ? null
      : imageAttachmentFromUrl(lead.generatedImageUrl);
    const attachments = generatedImageAttachment ? [generatedImageAttachment] : undefined;
    const generatedImageNote = lead.generatedImageUrl
      ? generatedImageAttachment
        ? "The generated visualization is attached to this email."
        : imageReferenceNote("Generated", lead.generatedImageUrl)
      : "No generated visualization was attached.";
    const originalImageNote = imageReferenceNote("Original", lead.originalImageUrl);
    const selectedStyles = formatSelectedStyles(lead.selectedStyles);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New quote request from ${fullName || "website visitor"} - ${tenant.companyName}`,
      attachments,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
          <h1 style="margin: 0 0 16px;">New quote request</h1>
          <p style="margin: 0 0 20px;">A visitor submitted a quote request from ${escapeHtml(tenant.companyName)}'s visualizer.</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
            <tr><td style="padding: 8px; font-weight: 700;">Name</td><td style="padding: 8px;">${escapeHtml(fullName)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Email</td><td style="padding: 8px;"><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Phone</td><td style="padding: 8px;">${escapeHtml(lead.phone || "Not provided")}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Location</td><td style="padding: 8px;">${escapeHtml(lead.location || "Not provided")}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Service</td><td style="padding: 8px;">${escapeHtml(lead.service || "Not provided")}</td></tr>
          </table>
          <h2 style="margin: 24px 0 8px;">Project details</h2>
          <p style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">${escapeHtml(lead.projectDetails || "No details provided")}</p>
          <h2 style="margin: 24px 0 8px;">Selected styles</h2>
          <pre style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">${escapeHtml(selectedStyles)}</pre>
          <p>${escapeHtml(generatedImageNote)}</p>
          <p>${escapeHtml(originalImageNote)}</p>
        </div>
      `,
      text: [
        "New quote request",
        "",
        `Tenant: ${tenant.companyName}`,
        `Name: ${fullName}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone || "Not provided"}`,
        `Location: ${lead.location || "Not provided"}`,
        `Service: ${lead.service || "Not provided"}`,
        "",
        "Project details:",
        lead.projectDetails || "No details provided",
        "",
        "Selected styles:",
        selectedStyles,
        "",
        generatedImageNote,
        originalImageNote,
      ].join("\n"),
    } as any);

    if (error) {
      console.error("Resend quote lead email error:", error);
      return false;
    }

    console.log("Quote lead email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Failed to send quote lead email:", error);
    return false;
  }
}

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
    if (!resend) {
      console.warn("RESEND_API is not configured; skipping team invitation email.");
      return false;
    }

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
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                          <tr>
                            <td style="padding-right: 16px; vertical-align: middle;">
                              <img src="${appUrl}/dreambuilder-logo.png" alt="DreamBuilder" style="height: 60px; width: auto; display: block;" />
                            </td>
                            <td style="vertical-align: middle;">
                              <h2 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; white-space: nowrap;">DreamBuilder</h2>
                            </td>
                          </tr>
                        </table>
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
                              
                              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                                <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join their team <strong style="color: #ffffff;">${teamName}</strong> on <strong style="color: #ffffff;">DreamBuilder</strong>
                              </p>
                              
                              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                                Join your team to collaborate on AI-powered visualization projects for landscaping, roofing, siding, pools, and more.
                              </p>
                              
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

${inviterName} has invited you to join their team ${teamName} on DreamBuilder.

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
