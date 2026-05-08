/**
 * POST /api/v1/auth/verify-turnstile
 *
 * Verifies Cloudflare Turnstile token server-side.
 * Used before sign-in and on contact form submissions.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};

  if (!token) {
    return res.status(400).json({ error: 'Turnstile token required' });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    // Fail open in dev — fail closed in prod
    if (process.env.VERCEL_ENV === 'production') {
      return res.status(500).json({ error: 'CAPTCHA not configured' });
    }
    return res.status(200).json({ success: true, score: 1 });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn('[Turnstile] Verification failed:', data['error-codes']);
      return res.status(400).json({
        error: 'CAPTCHA verification failed',
        codes: data['error-codes'] || [],
      });
    }

    return res.status(200).json({ success: true, challengeTs: data.challenge_ts });
  } catch (err) {
    console.error('[Turnstile] Error:', err.message);
    return res.status(500).json({ error: 'CAPTCHA verification error' });
  }
}
