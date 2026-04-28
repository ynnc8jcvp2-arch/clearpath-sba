/**
 * Verify Google reCAPTCHA v3 Token
 *
 * POST /api/v1/auth/verify-recaptcha
 *
 * Request body:
 * {
 *   "token": "recaptcha-token-from-frontend",
 *   "action": "login" (optional, default: "login")
 * }
 *
 * Response:
 * {
 *   "success": true/false,
 *   "score": 0-1,
 *   "action": "login",
 *   "challengeTs": "timestamp",
 *   "error": "error message if failed"
 * }
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, action = 'login' } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'reCAPTCHA token is required' });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured');
    return res.status(500).json({ error: 'reCAPTCHA verification not configured' });
  }

  try {
    // Call Google reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`reCAPTCHA API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        error: 'reCAPTCHA verification failed',
        details: data['error-codes'] || [],
      });
    }

    // Check score for login action (v3 specific)
    // Score ranges from 0.0 to 1.0 (1.0 = most likely legitimate, 0.0 = most likely bot)
    // We accept score >= 0.5 for login action
    if (data.action !== action || data.score < 0.5) {
      console.warn(`reCAPTCHA score too low for action "${action}": ${data.score}`);
      return res.status(400).json({
        error: 'reCAPTCHA verification failed (suspicious activity detected)',
        score: data.score,
        action: data.action,
      });
    }

    // Log successful verification
    console.log('reCAPTCHA verified successfully', {
      timestamp: new Date().toISOString(),
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      score: data.score,
      action: data.action,
    });

    return res.status(200).json({
      success: true,
      score: data.score,
      action: data.action,
      challengeTs: data.challenge_ts,
    });
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return res.status(500).json({
      error: 'Failed to verify reCAPTCHA',
      message: error.message,
    });
  }
}
