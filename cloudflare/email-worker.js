export default {
  async fetch(request, env) {
    return Response.json({
      ok: true,
      worker: 'tmail-email-worker',
      hasAppWebhookUrl: Boolean(env.APP_WEBHOOK_URL),
      hasWebhookSecret: Boolean(env.WEBHOOK_SECRET),
      hasBackupEmail: Boolean(env.BACKUP_EMAIL),
      appWebhookUrl: env.APP_WEBHOOK_URL || null
    });
  },

  async email(message, env, ctx) {
    if (!env.APP_WEBHOOK_URL || !env.WEBHOOK_SECRET) {
      console.error('Missing APP_WEBHOOK_URL or WEBHOOK_SECRET Worker variable');
      if (env.BACKUP_EMAIL) {
        try {
          await message.forward(env.BACKUP_EMAIL);
          console.log('Inbound email forwarded to Gmail backup while app webhook is unavailable');
        } catch (error) {
          console.error('Failed to forward inbound email:', formatWorkerError(error));
        }
      }
      return;
    }

    // Start the backup delivery before parsing the raw stream for the app webhook.
    const forwardToBackup = env.BACKUP_EMAIL ? message.forward(env.BACKUP_EMAIL) : null;
    const raw = await new Response(message.raw).arrayBuffer();
    const rawBase64 = arrayBufferToBase64(raw);
    const headers = {};
    for (const [key, value] of message.headers) {
      headers[key] = value;
    }

    console.log('Inbound email received', {
      from: message.from,
      to: message.to,
      rawSize: raw.byteLength,
      hasBackupEmail: Boolean(env.BACKUP_EMAIL)
    });

    const saveToApp = fetch(env.APP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBHOOK_SECRET
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        alias: message.to,
        headers,
        rawBase64
      })
    });

    const jobs = forwardToBackup ? [saveToApp, forwardToBackup] : [saveToApp];

    const results = await Promise.allSettled(jobs);
    const saveResult = results[0];
    if (saveResult.status === 'rejected') {
      console.error('Failed to save inbound email:', formatWorkerError(saveResult.reason));
    } else if (!saveResult.value.ok) {
      console.error('App webhook returned', saveResult.value.status, await saveResult.value.text());
    } else {
      console.log('Inbound email saved to app', await saveResult.value.text());
    }

    const forwardResult = results[1];
    if (forwardResult?.status === 'rejected') {
      console.error('Failed to forward inbound email:', formatWorkerError(forwardResult.reason));
    } else if (forwardResult?.status === 'fulfilled') {
      console.log('Inbound email forwarded to Gmail backup', { backupEmail: env.BACKUP_EMAIL });
    }
  }
};

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function formatWorkerError(error) {
  return String(error?.stack || error?.message || error || 'unknown error');
}
