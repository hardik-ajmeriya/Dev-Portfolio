/**
 * Email bodies for the client auto-reply.
 *
 * Kept separate from the request handler so the wording can be edited
 * without touching any logic. Both an HTML and a plain-text version are
 * sent — some clients block HTML, and having a text part measurably
 * improves deliverability.
 */

const BRAND = {
  name: 'Hardik Ajmeriya',
  site: 'https://hardikajmeriya.com',
  email: 'hardik.ajmeriya89@gmail.com',
  paper: '#f4f4f1',
  ink: '#0b0b0d',
  muted: '#6b6b73',
  line: '#e2e2dd',
  accent: '#3d2ef5',
};

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Confirmation sent to the person who submitted the form.
 * Deliberately restrained: it confirms receipt, restates what they told
 * us so they know it arrived intact, and sets a response expectation.
 */
export function clientAutoReply({ name, projectType, budget, timeline, message }) {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'there';

  const summaryRows = [
    ['Project type', projectType],
    ['Budget', budget],
    ['Timeline', timeline],
  ].filter(([, v]) => v);

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Thanks for your enquiry — I'll reply within 24 hours.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.line};border-radius:14px;">
        <tr><td style="padding:36px 36px 8px;">
          <p style="margin:0 0 22px;font:600 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.muted};">
            ${esc(BRAND.name)}
          </p>
          <h1 style="margin:0 0 18px;font:700 26px/1.25 Georgia,'Times New Roman',serif;color:${BRAND.ink};">
            Thanks, ${esc(firstName)}.
          </h1>
          <p style="margin:0 0 16px;font:400 15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.ink};">
            Your project enquiry has come through. I read every one personally —
            not a team, not a bot — and I'll get back to you
            <strong>within 24 hours</strong>, Monday to Saturday.
          </p>
          <p style="margin:0 0 28px;font:400 15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.ink};">
            If it turns out I'm not the right fit for what you need, I'll tell you
            that plainly and point you somewhere better.
          </p>
        </td></tr>

        ${
          summaryRows.length
            ? `<tr><td style="padding:0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid ${BRAND.line};border-radius:10px;background:${BRAND.paper};">
            <tr><td style="padding:18px 20px 6px;">
              <p style="margin:0 0 14px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.muted};">
                What you sent
              </p>
              ${summaryRows
                .map(
                  ([label, value]) => `
              <p style="margin:0 0 10px;font:400 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.ink};">
                <span style="color:${BRAND.muted};">${esc(label)}:</span> ${esc(value)}
              </p>`
                )
                .join('')}
            </td></tr>
          </table>
        </td></tr>`
            : ''
        }

        ${
          message
            ? `<tr><td style="padding:22px 36px 0;">
          <p style="margin:0 0 8px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.muted};">
            Your brief
          </p>
          <p style="margin:0;padding:0 0 0 14px;border-left:2px solid ${BRAND.line};
                    font:400 14px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    color:${BRAND.muted};white-space:pre-wrap;">${esc(message)}</p>
        </td></tr>`
            : ''
        }

        <tr><td style="padding:30px 36px 36px;">
          <p style="margin:0 0 6px;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.ink};">
            — ${esc(BRAND.name)}
          </p>
          <p style="margin:0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.muted};">
            Full-stack development &amp; cloud deployment<br>
            <a href="${BRAND.site}" style="color:${BRAND.accent};text-decoration:none;">hardikajmeriya.com</a>
          </p>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;font:400 12px/1.5 -apple-system,sans-serif;color:${BRAND.muted};">
        You received this because you submitted the contact form at hardikajmeriya.com
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Thanks, ${firstName}.`,
    '',
    "Your project enquiry has come through. I read every one personally — not a team, not a bot — and I'll get back to you within 24 hours, Monday to Saturday.",
    '',
    "If it turns out I'm not the right fit for what you need, I'll tell you that plainly and point you somewhere better.",
    '',
    ...(summaryRows.length
      ? ['What you sent:', ...summaryRows.map(([l, v]) => `  ${l}: ${v}`), '']
      : []),
    ...(message ? ['Your brief:', message, ''] : []),
    `— ${BRAND.name}`,
    'Full-stack development & cloud deployment',
    BRAND.site,
    '',
    'You received this because you submitted the contact form at hardikajmeriya.com',
  ].join('\n');

  return {
    subject: 'Thanks — your project enquiry has been received',
    html,
    text,
  };
}

/**
 * Notification sent to Hardik when someone submits the form.
 * The caller sets `reply_to` to the visitor's address, so hitting Reply in
 * the mail client goes straight back to them — this body doesn't need to
 * repeat their email for that to work, but it's included for scanability.
 */
export function ownerNotification({ name, email, company, projectType, budget, timeline, message, submittedAt }) {
  const summaryRows = [
    ['Email', email],
    ['Company', company],
    ['Project type', projectType],
    ['Budget', budget],
    ['Timeline', timeline],
    ['Submitted', submittedAt],
  ].filter(([, v]) => v);

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.line};border-radius:14px;">
        <tr><td style="padding:36px 36px 8px;">
          <p style="margin:0 0 22px;font:600 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.muted};">
            New project enquiry
          </p>
          <h1 style="margin:0 0 18px;font:700 26px/1.25 Georgia,'Times New Roman',serif;color:${BRAND.ink};">
            ${esc(name)}
          </h1>
        </td></tr>

        <tr><td style="padding:0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid ${BRAND.line};border-radius:10px;background:${BRAND.paper};">
            <tr><td style="padding:18px 20px 6px;">
              ${summaryRows
                .map(
                  ([label, value]) => `
              <p style="margin:0 0 10px;font:400 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.ink};">
                <span style="color:${BRAND.muted};">${esc(label)}:</span> ${esc(value)}
              </p>`
                )
                .join('')}
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 36px 30px;">
          <p style="margin:0 0 8px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.muted};">
            Project overview
          </p>
          <p style="margin:0;padding:0 0 0 14px;border-left:2px solid ${BRAND.line};
                    font:400 14px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    color:${BRAND.ink};white-space:pre-wrap;">${esc(message)}</p>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;font:400 12px/1.5 -apple-system,sans-serif;color:${BRAND.muted};">
        Reply to this email to respond directly to ${esc((name || '').trim().split(/\s+/)[0] || 'them')}.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `New project enquiry — ${name}`,
    '',
    ...summaryRows.map(([l, v]) => `${l}: ${v}`),
    '',
    'Project overview:',
    message,
    '',
    'Reply to this email to respond directly to the enquirer.',
  ].join('\n');

  return {
    subject: `New enquiry — ${name}${budget ? ` · ${budget}` : ''}${timeline ? ` · ${timeline}` : ''}`,
    html,
    text,
  };
}

export { BRAND };
