const sendEmail = async ({ to, subject, html }) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_USER || 'mint.dih.ethiopia@gmail.com';
    const fromName = 'Digital Innovation Hub';

    console.log(
      `Email check → apiKey=${apiKey ? 'SET' : 'MISSING'} from=${fromEmail} to=${to}`
    );

    if (!apiKey) {
      console.log('Email skipped: BREVO_API_KEY not set on Render');
      return { ok: false, reason: 'missing_api_key' };
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg =
        data?.message ||
        data?.error ||
        JSON.stringify(data) ||
        `HTTP ${response.status}`;
      console.error('Email FAILED →', msg);
      return { ok: false, reason: msg };
    }

    console.log(`Email OK → to=${to} subject="${subject}" id=${data?.messageId || 'ok'}`);
    return { ok: true, id: data?.messageId };
  } catch (error) {
    console.error('Email FAILED →', error.message);
    return { ok: false, reason: error.message };
  }
};

module.exports = sendEmail;