import { Resend } from 'resend';
import type { Lead, Tenant } from '@shared/schema';

const resendApiKey = process.env.RESEND_API || process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendAccountEmail(to: string, subject: string, message: string, linkPath: string): Promise<boolean> {
  const base = process.env.APP_URL || process.env.PRODUCTION_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : `http://localhost:${process.env.PORT || 5000}`);
  if (!resend) return false;
  try {
    const result = await resend.emails.send({ from: process.env.EMAIL_FROM || "onboarding@resend.dev", to, subject,
      html: `<p>${escapeHtml(message)}</p><p><a href="${escapeHtml(base.replace(/\/$/, '') + linkPath)}">Continue to DreamBuilder</a></p>` });
    return !result.error;
  } catch { return false; }
}

type EmailAttachment = {
  filename?: string | false;
  content?: Buffer;
  contentType?: string;
  path?: string;
  contentId?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type SelectedStyleTag = {
  label: string;
  value: string;
};

const SELECTION_LABELS: Record<string, string> = {
  roof: "Roof",
  siding: "Siding",
  windows: "Windows",
  surpriseMe: "Surprise Me",
  curbing: "Curbing",
  landscape: "Landscape",
  patios: "Patio",
  patio: "Patio",
  poolType: "Pool Type",
  poolSize: "Pool Size",
  decking: "Decking",
  landscaping: "Landscaping",
  features: "Features",
  hotTub: "Hot Tub",
  sauna: "Sauna",
  service: "Service",
  styles: "Styles",
};

function titleCaseSelection(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function friendlySelectionValue(value: unknown, category = "") {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";

  return rawValue
    .split("__color__")
    .map((part) => part
      .replace(/^tenant_custom_exterior_(roof|siding|windows)_/i, "")
      .replace(/^tenant_color_/i, "")
      .replace(new RegExp(`^${category}_`, "i"), "")
      .replace(/_[0-9a-f]{6}$/i, "")
      .replace(/\s*\(#[0-9a-f]{6}\)\s*$/i, "")
      .trim())
    .filter(Boolean)
    .map(titleCaseSelection)
    .join(" · ");
}

function selectionTag(label: string, value: unknown, category = ""): SelectedStyleTag | null {
  const friendlyValue = friendlySelectionValue(value, category);
  return friendlyValue ? { label, value: friendlyValue } : null;
}

export function formatSelectedStyleTags(selectedStyles: unknown): SelectedStyleTag[] {
  if (!selectedStyles) return [];

  if (typeof selectedStyles === "string") {
    try {
      const parsed = JSON.parse(selectedStyles);
      if (parsed !== selectedStyles) return formatSelectedStyleTags(parsed);
    } catch {
      // Plain strings are valid selections.
    }
    const tag = selectionTag("Design", selectedStyles);
    return tag ? [tag] : [];
  }

  if (Array.isArray(selectedStyles)) {
    return selectedStyles
      .map((value) => selectionTag("Style", value))
      .filter((tag): tag is SelectedStyleTag => Boolean(tag));
  }

  if (typeof selectedStyles !== "object") {
    const tag = selectionTag("Design", selectedStyles);
    return tag ? [tag] : [];
  }

  return Object.entries(selectedStyles as Record<string, unknown>).flatMap(([category, selection]) => {
    const label = SELECTION_LABELS[category] || titleCaseSelection(category);

    if (selection && typeof selection === "object" && !Array.isArray(selection)) {
      const details = selection as Record<string, unknown>;
      if (details.enabled === false) return [];

      const styleValue = details.type
        ?? details.style
        ?? details.design
        ?? details.selectedStyle
        ?? details.value;
      const colorValue = details.color ?? details.selectedColor;
      const friendlyStyle = friendlySelectionValue(styleValue, category);
      const friendlyColor = friendlySelectionValue(colorValue, category);
      const value = [friendlyStyle, friendlyColor]
        .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
        .join(" · ");

      return value ? [{ label, value }] : [];
    }

    if (Array.isArray(selection)) {
      const value = selection
        .map((item) => friendlySelectionValue(item, category))
        .filter(Boolean)
        .join(", ");
      return value ? [{ label, value }] : [];
    }

    const tag = selectionTag(label, selection, category);
    return tag ? [tag] : [];
  });
}

function normalizeEmailColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function getEmailContrastColor(color: string) {
  const value = Number.parseInt(color.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return (red * 299 + green * 587 + blue * 114) / 1000 > 165 ? "#0f172a" : "#ffffff";
}

function safeExternalImageUrl(value?: string | null) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
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
      contentId: "generated-design",
    };
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return {
      filename: "generated-design.jpg",
      path: imageUrl,
      contentId: "generated-design",
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
    const selectedStyleTags = formatSelectedStyleTags(lead.selectedStyles);
    const selectedStylesText = selectedStyleTags.length
      ? selectedStyleTags.map((tag) => `${tag.label}: ${tag.value}`).join("\n")
      : "Not provided";
    const primaryColor = normalizeEmailColor(tenant.embedPrimaryColor || tenant.primaryColor, "#0f766e");
    const secondaryColor = normalizeEmailColor(tenant.embedSecondaryColor || tenant.secondaryColor, primaryColor);
    const primaryTextColor = getEmailContrastColor(primaryColor);
    const logoUrl = safeExternalImageUrl(tenant.logoUrl);
    const originalImageLink = safeExternalImageUrl(lead.originalImageUrl);
    const selectedStylesHtml = selectedStyleTags.length
      ? selectedStyleTags.map((tag) => `
          <span style="display: inline-block; margin: 0 8px 8px 0; padding: 8px 11px; border: 1px solid ${primaryColor}; border-radius: 999px; background: #f8fafc; font-size: 13px; line-height: 18px; color: #334155;">
            <strong style="color: #0f172a;">${escapeHtml(tag.label)}:</strong> ${escapeHtml(tag.value)}
          </span>
        `).join("")
      : `<span style="display: inline-block; padding: 8px 11px; border: 1px solid #e2e8f0; border-radius: 999px; background: #f8fafc; font-size: 13px; line-height: 18px; color: #64748b;">Not provided</span>`;
    const generatedImagePreview = generatedImageAttachment
      ? `
          <tr>
            <td style="padding: 0 32px 28px;">
              <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Generated design</div>
              <img src="cid:generated-design" alt="Generated project design" style="display: block; width: 100%; max-height: 440px; object-fit: cover; border-radius: 14px; border: 1px solid #e2e8f0;" />
            </td>
          </tr>
        `
      : "";
    const logoHtml = logoUrl
      ? `<div style="display: inline-block; padding: 8px 12px; border-radius: 10px; background: #ffffff;"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(tenant.companyName)} logo" style="display: block; max-width: 190px; max-height: 58px; object-fit: contain;" /></div>`
      : `<div style="font-size: 20px; line-height: 26px; font-weight: 800; color: ${primaryTextColor};">${escapeHtml(tenant.companyName)}</div>`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New quote request from ${fullName || "website visitor"} - ${tenant.companyName}`,
      attachments,
      html: `
        <!doctype html>
        <html>
          <body style="margin: 0; padding: 0; background: #f1f5f9; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f1f5f9;">
              <tr>
                <td align="center" style="padding: 32px 16px;">
                  <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 680px; overflow: hidden; border-radius: 18px; background: #ffffff; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10);">
                    <tr>
                      <td style="height: 7px; background: ${secondaryColor}; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 32px; background: ${primaryColor}; color: ${primaryTextColor};">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="vertical-align: middle;">${logoHtml}</td>
                            <td align="right" style="vertical-align: middle; font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${primaryTextColor};">Visualizer quote</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 32px 22px;">
                        <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">New project opportunity</div>
                        <h1 style="margin: 6px 0 8px; font-size: 28px; line-height: 34px; color: #0f172a;">New quote request from ${escapeHtml(fullName || "a website visitor")}</h1>
                        <p style="margin: 0; font-size: 15px; line-height: 24px; color: #64748b;">Submitted through ${escapeHtml(tenant.companyName)}'s design visualizer. The generated design and project information are together below.</p>
                      </td>
                    </tr>
                    ${generatedImagePreview}
                    <tr>
                      <td style="padding: 0 32px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                          <tr><td style="width: 32%; padding: 11px 14px; background: #f8fafc; font-size: 13px; font-weight: 700; color: #475569;">Name</td><td style="padding: 11px 14px; font-size: 14px;">${escapeHtml(fullName)}</td></tr>
                          <tr><td style="padding: 11px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">Email</td><td style="padding: 11px 14px; border-top: 1px solid #e2e8f0; font-size: 14px;"><a href="mailto:${escapeHtml(lead.email)}" style="color: ${primaryColor};">${escapeHtml(lead.email)}</a></td></tr>
                          <tr><td style="padding: 11px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">Phone</td><td style="padding: 11px 14px; border-top: 1px solid #e2e8f0; font-size: 14px;">${escapeHtml(lead.phone || "Not provided")}</td></tr>
                          <tr><td style="padding: 11px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">Location</td><td style="padding: 11px 14px; border-top: 1px solid #e2e8f0; font-size: 14px;">${escapeHtml(lead.location || "Not provided")}</td></tr>
                          <tr><td style="padding: 11px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">Service</td><td style="padding: 11px 14px; border-top: 1px solid #e2e8f0; font-size: 14px;">${escapeHtml(lead.service || "Not provided")}</td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 32px 24px;">
                        <h2 style="margin: 0 0 8px; font-size: 17px; line-height: 24px; color: #0f172a;">Project details</h2>
                        <div style="white-space: pre-wrap; background: #f8fafc; border-left: 4px solid ${primaryColor}; padding: 14px 16px; border-radius: 8px; font-size: 14px; line-height: 22px; color: #334155;">${escapeHtml(lead.projectDetails || "No details provided")}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 32px 26px;">
                        <h2 style="margin: 0 0 10px; font-size: 17px; line-height: 24px; color: #0f172a;">Selected design</h2>
                        <div style="font-size: 0;">${selectedStylesHtml}</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 0 32px 32px;">
                        <a href="mailto:${escapeHtml(lead.email)}" style="display: inline-block; padding: 12px 22px; border-radius: 9px; background: ${primaryColor}; color: ${primaryTextColor}; font-size: 14px; font-weight: 700; text-decoration: none;">Reply to ${escapeHtml(lead.firstName || "visitor")}</a>
                        ${originalImageLink ? `<div style="margin-top: 14px; font-size: 12px;"><a href="${escapeHtml(originalImageLink)}" style="color: #64748b;">View original project photo</a></div>` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 18px 32px; border-top: 1px solid #e2e8f0; background: #f8fafc; font-size: 12px; line-height: 18px; color: #94a3b8;">Sent from the ${escapeHtml(tenant.companyName)} DreamBuilder visualizer</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
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
        selectedStylesText,
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
