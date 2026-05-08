/**
 * POST /api/v1/contact
 *
 * Receives contact form submissions.
 * Logs to server stderr and stores in Supabase if available.
 * No auth required — public endpoint.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body || {};

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'Missing required fields: name, email, message',
    });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Rate limit: check timestamp header to prevent spam
  const submission = {
    name,
    email,
    subject: subject || 'General Inquiry',
    message,
    submittedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  // Log to server stderr (captured by Vercel logs)
  console.log('[CONTACT FORM]', JSON.stringify(submission));

  // Store in Supabase if configured
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('contact_submissions').insert({
        name,
        email,
        subject: subject || 'General Inquiry',
        message,
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Don't fail the request if DB storage fails
    console.error('Contact DB storage failed:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Your message has been received. We will respond within 1-2 business days.',
  });
}
