/**
 * POST /api/v1/audit/alert
 *
 * Receives security alerts from the client-side audit logger.
 * Logs to server stderr and optionally forwards to external monitoring.
 */

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const alert = req.body || {};

  // Always log to server stderr (captured by Vercel logs)
  console.error('[SECURITY ALERT]', JSON.stringify({
    ...alert,
    receivedAt: new Date().toISOString(),
    serverIp: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
  }));

  // Optionally forward to Slack webhook if configured
  const slackWebhook = process.env.SLACK_SECURITY_WEBHOOK;
  if (slackWebhook) {
    fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *Security Alert*: \`${alert.action}\` — User: ${alert.user_id || 'unknown'} — Status: ${alert.status_code}`,
      }),
    }).catch((err) => console.error('Slack alert failed:', err));
  }

  return res.status(200).json({ received: true });
}
