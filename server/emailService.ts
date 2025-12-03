import nodemailer from "nodemailer";
import type { EmailService, Template, Contact, Campaign, LandingPage } from "@shared/schema";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  trackingId?: string;
  baseUrl?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function parseSmtpConfig(apiKey: string): EmailConfig | null {
  try {
    const parsed = JSON.parse(apiKey);
    return {
      host: parsed.host || "localhost",
      port: parseInt(parsed.port) || 587,
      secure: parsed.secure === true || parsed.port === 465,
      user: parsed.user || parsed.username || "",
      password: parsed.password || parsed.pass || "",
    };
  } catch {
    return null;
  }
}

function createTransporter(emailService: EmailService) {
  if (emailService.provider === "smtp") {
    const config = parseSmtpConfig(emailService.apiKey);
    if (!config) {
      throw new Error("Invalid SMTP configuration");
    }
    
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }
  
  throw new Error(`Unsupported email provider: ${emailService.provider}`);
}

function replaceVariables(
  content: string, 
  contact: Contact, 
  campaign: Campaign,
  trackingId: string,
  baseUrl: string
): string {
  let result = content;
  
  result = result.replace(/\{\{firstName\}\}/gi, contact.firstName || "");
  result = result.replace(/\{\{lastName\}\}/gi, contact.lastName || "");
  result = result.replace(/\{\{email\}\}/gi, contact.email);
  result = result.replace(/\{\{fullName\}\}/gi, 
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email
  );
  
  const phishingUrl = `${baseUrl}/api/track/click/${trackingId}`;
  result = result.replace(/\{\{url\}\}/gi, phishingUrl);
  result = result.replace(/\{\{phishingUrl\}\}/gi, phishingUrl);
  result = result.replace(/\{\{link\}\}/gi, phishingUrl);
  
  if (contact.customFields) {
    for (const [key, value] of Object.entries(contact.customFields)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), value || "");
    }
  }
  
  const trackingPixel = `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`;
  if (!result.includes("</body>")) {
    result += trackingPixel;
  } else {
    result = result.replace("</body>", `${trackingPixel}</body>`);
  }
  
  return result;
}

export async function sendCampaignEmail(
  emailService: EmailService,
  template: Template,
  contact: Contact,
  campaign: Campaign,
  trackingId: string,
  baseUrl: string
): Promise<SendResult> {
  try {
    const transporter = createTransporter(emailService);
    
    const htmlContent = replaceVariables(
      template.htmlContent,
      contact,
      campaign,
      trackingId,
      baseUrl
    );
    
    const textContent = template.textContent 
      ? replaceVariables(template.textContent, contact, campaign, trackingId, baseUrl)
      : undefined;
    
    const subject = replaceVariables(template.subject, contact, campaign, trackingId, baseUrl);
    
    const info = await transporter.sendMail({
      from: emailService.fromName 
        ? `"${emailService.fromName}" <${emailService.fromEmail || "noreply@example.com"}>`
        : emailService.fromEmail || "noreply@example.com",
      to: contact.email,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function testSmtpConnection(emailService: EmailService): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(emailService);
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function sendTestEmail(
  emailService: EmailService,
  toEmail: string,
  subject: string = "Test Email from PhishGuard",
  body: string = "<h1>Test Email</h1><p>This is a test email from PhishGuard.</p>"
): Promise<SendResult> {
  try {
    const transporter = createTransporter(emailService);
    
    const info = await transporter.sendMail({
      from: emailService.fromName 
        ? `"${emailService.fromName}" <${emailService.fromEmail || "noreply@example.com"}>`
        : emailService.fromEmail || "noreply@example.com",
      to: toEmail,
      subject: subject,
      html: body,
    });
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
