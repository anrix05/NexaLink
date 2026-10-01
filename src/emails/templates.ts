/**
 * NexaLink Transactional Email Templates (Section 9)
 *
 * Minimal plain-text and monochrome HTML email templates for user registration
 * and account verification status changes.
 *
 * Adheres strictly to institutional Open Canvas design standards:
 * - Clean monospace / system sans-serif typography
 * - Monochrome palette (#0A0A0A text, #6B7280 muted, #E5E7EB hairlines, #FAFAFA canvas)
 * - Tabular numbers and machine-readable reference identifiers
 * - No promotional or marketing fluff
 */

export interface BaseEmailContext {
  name: string;
  refId: string;
}

export interface RegistrationReceivedContext extends BaseEmailContext {
  etaDateFormatted: string;
  gateUrl: string;
}

export interface ActionNeededContext extends BaseEmailContext {
  actionType: 'needs_document' | 'needs_recovery_email' | 'needs_clarification';
  actionSummary: string;
  details?: string;
  gateUrl: string;
}

export interface RegistrationVerifiedContext extends BaseEmailContext {
  role: string;
  dashboardUrl: string;
}

export interface RegistrationRejectedContext extends BaseEmailContext {
  reason: string;
  resubmitUrl: string;
  registrarEmail?: string;
}

function monochromeHtmlWrapper(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FAFAFA;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0A0A0A;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 4px;
      padding: 36px 32px;
    }
    .header {
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #0A0A0A;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #0A0A0A;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      color: #374151;
      margin: 0 0 16px 0;
    }
    .meta-box {
      background-color: #FAFAFA;
      border: 1px solid #E5E7EB;
      border-radius: 4px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      color: #6B7280;
    }
    .meta-value {
      color: #0A0A0A;
      font-weight: 500;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .btn {
      display: inline-block;
      background-color: #0A0A0A;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      padding: 10px 20px;
      border-radius: 4px;
      margin-top: 12px;
      margin-bottom: 20px;
    }
    .footer {
      border-top: 1px solid #E5E7EB;
      padding-top: 18px;
      margin-top: 28px;
      font-size: 12px;
      color: #6B7280;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">NexaLink · Vidyalankar Institute of Technology</div>
    </div>
    ${bodyContent}
    <div class="footer">
      This is an automated institutional service message sent to your primary and recovery email addresses.
      If you did not initiate this request, contact support@vit.edu.in.
    </div>
  </div>
</body>
</html>`;
}

// 1. We received your registration
export function renderRegistrationReceivedEmail(ctx: RegistrationReceivedContext) {
  const plainText = `NexaLink · Vidyalankar Institute of Technology
------------------------------------------------------------
REGISTRATION RECEIVED

Hello ${ctx.name},

We have received your registration for NexaLink. Your account details have been routed to the registrar and department verification team.

Reference ID: ${ctx.refId}
Expected Review Completion: ${ctx.etaDateFormatted} (within 2 business days)

You can track your real-time verification status or update contact details at:
${ctx.gateUrl}

Regards,
Registrar Office
Vidyalankar Institute of Technology, Wadala
`;

  const html = monochromeHtmlWrapper(
    'Registration received — NexaLink',
    `
    <div class="eyebrow">Registration status</div>
    <h1>We received your registration</h1>
    <p>Hello ${ctx.name},</p>
    <p>Your registration details have been submitted and routed to the registrar and department verification committee.</p>
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Reference ID</span>
        <span class="meta-value">${ctx.refId}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Estimated decision</span>
        <span class="meta-value">${ctx.etaDateFormatted} (2 business days)</span>
      </div>
    </div>
    <p>You can check your status at any time or make corrections while review is in progress.</p>
    <a href="${ctx.gateUrl}" class="btn">View registration status</a>
  `
  );

  return { subject: `Registration received [Ref: ${ctx.refId}] — NexaLink`, plainText, html };
}

// 2. Action needed on your registration
export function renderActionNeededEmail(ctx: ActionNeededContext) {
  const plainText = `NexaLink · Vidyalankar Institute of Technology
------------------------------------------------------------
ACTION NEEDED ON YOUR REGISTRATION

Hello ${ctx.name},

Your registration (Ref: ${ctx.refId}) requires additional information before we can approve your access.

Required Action: ${ctx.actionSummary}
${ctx.details ? `Details from Registrar: ${ctx.details}\n` : ''}

Please review this request and provide the required information at:
${ctx.gateUrl}

Regards,
Verification Desk
Vidyalankar Institute of Technology, Wadala
`;

  const html = monochromeHtmlWrapper(
    'Action needed on your registration — NexaLink',
    `
    <div class="eyebrow">Action needed</div>
    <h1>Action needed on your registration</h1>
    <p>Hello ${ctx.name},</p>
    <p>The verification desk reviewed your submission (Reference ID: <code style="font-family: monospace;">${ctx.refId}</code>) and requires an update before we can proceed.</p>
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Required step</span>
        <span class="meta-value">${ctx.actionSummary}</span>
      </div>
      ${
        ctx.details
          ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB; color: #374151;">
              <strong>Note from registrar:</strong> ${ctx.details}
             </div>`
          : ''
      }
    </div>
    <a href="${ctx.gateUrl}" class="btn">Complete required action</a>
  `
  );

  return { subject: `Action needed: Registration [Ref: ${ctx.refId}] — NexaLink`, plainText, html };
}

// 3. You're verified
export function renderRegistrationVerifiedEmail(ctx: RegistrationVerifiedContext) {
  const plainText = `NexaLink · Vidyalankar Institute of Technology
------------------------------------------------------------
ACCOUNT VERIFIED

Hello ${ctx.name},

Your registration has been approved. Your NexaLink account is now active as a verified ${ctx.role}.

Reference ID: ${ctx.refId}

Getting Started Checklist:
1. Complete your research interests and technical skills profile.
2. Explore department mentors and office hours.
3. Access verified student/faculty communication channels.

Sign in to your portal:
${ctx.dashboardUrl}

Welcome to NexaLink.
Vidyalankar Institute of Technology, Wadala
`;

  const html = monochromeHtmlWrapper(
    "You're verified — Welcome to NexaLink",
    `
    <div class="eyebrow">Access granted</div>
    <h1>You're verified</h1>
    <p>Hello ${ctx.name},</p>
    <p>Your institutional affiliation has been confirmed. Your account is now active as a verified <strong>${ctx.role}</strong>.</p>
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Reference ID</span>
        <span class="meta-value">${ctx.refId}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status</span>
        <span class="meta-value" style="color: #059669;">Verified</span>
      </div>
    </div>
    <p>Your access to campus opportunities, department channels, and directory records is now unlocked.</p>
    <a href="${ctx.dashboardUrl}" class="btn">Go to your dashboard</a>
  `
  );

  return { subject: `Welcome to NexaLink: You're verified [Ref: ${ctx.refId}]`, plainText, html };
}

// 4. We couldn't verify your registration
export function renderRegistrationRejectedEmail(ctx: RegistrationRejectedContext) {
  const registrar = ctx.registrarEmail || 'registrar@vit.edu.in';
  const plainText = `NexaLink · Vidyalankar Institute of Technology
------------------------------------------------------------
REGISTRATION NOT APPROVED

Hello ${ctx.name},

We were unable to verify your registration (Ref: ${ctx.refId}) against institutional enrollment records.

Reason: ${ctx.reason}

If you made an error in your submitted details, you may correct them and resubmit:
${ctx.resubmitUrl}

If you believe this determination was made in error, please visit the Academic Registrar Office (Building A, Ground Floor) or contact ${registrar}.

Regards,
Registrar Office
Vidyalankar Institute of Technology, Wadala
`;

  const html = monochromeHtmlWrapper(
    'Registration update — NexaLink',
    `
    <div class="eyebrow">Registration status</div>
    <h1>We couldn't verify your registration</h1>
    <p>Hello ${ctx.name},</p>
    <p>We were unable to verify your registration against active college enrollment records.</p>
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Reference ID</span>
        <span class="meta-value">${ctx.refId}</span>
      </div>
      <div style="margin-top: 10px; color: #DC2626; font-size: 13px;">
        <strong>Reason:</strong> ${ctx.reason}
      </div>
    </div>
    <p>You can edit your submitted information (such as your PRN, department, or proof document) and submit again for re-evaluation.</p>
    <a href="${ctx.resubmitUrl}" class="btn">Edit details & resubmit</a>
    <p style="font-size: 12px; color: #6B7280; margin-top: 18px;">
      For in-person assistance, visit the Academic Registrar Office (Building A, Ground Floor) or email <a href="mailto:${registrar}" style="color: #0A0A0A;">${registrar}</a>.
    </p>
  `
  );

  return { subject: `Registration update [Ref: ${ctx.refId}] — NexaLink`, plainText, html };
}
