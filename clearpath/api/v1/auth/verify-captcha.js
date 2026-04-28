/**
 * Verify Cloudflare Turnstile CAPTCHA Token
 *
 * POST /api/v1/auth/verify-captcha
 *
 * Request body:
 * {
 *   "token": "turnstile-token-from-frontend"
 * }
 *
 * Response:
 * {
 *   "success": true/false,
 *   "score": 0-1,
 *   "error": "error message if failed"
 * }
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Captcha token is required' });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Captcha verification not configured' });
  }

  try {
    // Call Cloudflare Turnstile API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Turnstile API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        error: 'Captcha verification failed',
        details: data['error-codes'] || [],
      });
    }

    // Log successful verification
    console.log('Captcha verified successfully', {
      timestamp: new Date().toISOString(),
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      score: data.score || null,
    });

    return res.status(200).json({
      success: true,
      score: data.score || null,
      challengeTs: data.challenge_ts,
    });
  } catch (error) {
    console.error('Captcha verification error:', error);
    return res.status(500).json({
      error: 'Failed to verify captcha',
      message: error.message,
    });
  }
}
