// Debug endpoint to check environment variables
export default async function handler(request, response) {
  try {
    const envCheck = {
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      hasXssFeature: !!process.env.FEATURE_XSS_PROTECTION,
      hasCorsFeature: !!process.env.FEATURE_STRICT_CORS,
      tursoUrlPrefix: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
      nodeVersion: process.version,
      platform: process.platform
    };

    return response.status(200).json(envCheck);
  } catch (error) {
    return response.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
