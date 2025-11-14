# Monitoring & Alerting Setup

## Overview

MafClubScore поддерживает интеграцию с популярными сервисами мониторинга и алертинга через environment variables.

## Supported Services

### 1. Sentry (Error Tracking)

**Recommended for:** Production error tracking and performance monitoring

**Setup:**
```bash
# Vercel Dashboard → Project → Settings → Environment Variables
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of requests
```

**Features:**
- Automatic error capturing
- Performance monitoring
- Request tracing
- User context tracking

### 2. Datadog (Full-stack monitoring)

**Recommended for:** Complete observability (logs, metrics, traces)

**Setup:**
```bash
# Vercel Dashboard → Environment Variables
DD_API_KEY=your_datadog_api_key
DD_SITE=datadoghq.com  # or datadoghq.eu
DD_ENV=production
DD_SERVICE=mafclubscore
```

**Features:**
- APM (Application Performance Monitoring)
- Log aggregation
- Custom metrics
- Real-time dashboards

### 3. Vercel Analytics (Built-in)

**Recommended for:** Basic usage analytics (already enabled)

**Setup:**
```bash
# Enable in Vercel Dashboard → Analytics
# No environment variables needed
```

**Features:**
- Page views
- Web Vitals
- Real User Monitoring (RUM)
- Audience insights

### 4. Uptime Monitoring

**Recommended services:**
- **UptimeRobot** (free tier available)
- **Pingdom**
- **Better Uptime**

**Setup:**
```bash
# Add monitoring endpoints
https://score.mafclub.biz/api/health  # Health check
https://score.mafclub.biz/api/version # Version check
```

**Alert on:**
- Status code != 200
- Response time > 2000ms
- Downtime > 1 minute

## Logger Integration

Our custom logger (`shared/logger.js`) outputs structured JSON logs in production:

```json
{
  "timestamp": "2025-01-15T12:00:00.000Z",
  "level": 0,
  "message": "API Request",
  "method": "GET",
  "url": "/api/rating",
  "statusCode": 200,
  "duration": "45ms",
  "env": "production",
  "region": "iad1"
}
```

### Log Levels
- `0` = ERROR (critical issues)
- `1` = WARN (warnings, security events)
- `2` = INFO (general information)
- `3` = HTTP (request logs)
- `4` = DEBUG (detailed debugging)

## Recommended Monitoring Setup

### Minimal Setup (Free Tier)
1. **Vercel Analytics** - built-in, already enabled
2. **UptimeRobot** - health check monitoring
3. **Production Logger** - structured logging to Vercel logs

### Standard Setup
1. **Sentry** (Errors & Performance)
2. **Vercel Analytics** (Web Vitals)
3. **UptimeRobot** (Uptime)
4. **Production Logger**

### Enterprise Setup
1. **Datadog** (Full observability)
2. **PagerDuty** (On-call alerting)
3. **Vercel Analytics**
4. **Production Logger**

## Key Metrics to Monitor

### Application Metrics
- **Error Rate**: Errors per minute
- **Response Time**: p50, p95, p99 latencies
- **Request Rate**: Requests per second
- **Database Query Time**: Turso query latency

### Business Metrics
- **Active Users**: Daily/Monthly active players
- **Games Played**: Games per day
- **Rating Calculation Time**: Time to recalculate ratings
- **Cache Hit Rate**: Percentage of cached responses

### Security Metrics
- **Failed Login Attempts**: Rate limit triggers
- **CSRF Violations**: Invalid token submissions
- **SQL Injection Attempts**: Validation failures
- **Rate Limit Hits**: Per endpoint

## Alert Configuration

### Critical Alerts (Immediate notification)
- **Error rate > 5%** in 5 minutes
- **Response time p95 > 2s** for 5 minutes
- **Downtime > 1 minute**
- **Database connection failed**

### Warning Alerts (Review within 1 hour)
- **Error rate > 1%** in 15 minutes
- **Cache hit rate < 50%** for rating endpoint
- **Rate limit hits > 100/hour**
- **Memory usage > 80%**

### Info Alerts (Daily digest)
- **Daily error summary**
- **Performance trends**
- **Top errors by count**
- **Slow queries report**

## Implementation Example (Sentry)

If you want to add Sentry integration:

1. **Install SDK:**
```bash
npm install @sentry/node @sentry/tracing
```

2. **Create `shared/monitoring.js`:**
```javascript
import * as Sentry from '@sentry/node';
import logger from './logger.js';

const isProduction = process.env.VERCEL_ENV === 'production';

if (isProduction && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    beforeSend(event) {
      // Filter out expected errors
      if (event.exception?.values?.[0]?.value?.includes('Invalid Player ID')) {
        return null; // Don't send validation errors
      }
      return event;
    }
  });

  logger.info('Sentry initialized', { dsn: process.env.SENTRY_DSN.split('@')[1] });
}

export function captureException(error, context = {}) {
  if (isProduction && process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  logger.error('Exception captured', error);
}

export function captureMessage(message, level = 'info') {
  if (isProduction && process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
  logger.info(message);
}
```

3. **Use in error handler:**
```javascript
import { captureException } from '../shared/monitoring.js';

export function handleError(response, error, message = 'Internal Server Error') {
  captureException(error, { message, statusCode: 500 });
  // ... rest of error handling
}
```

## Vercel Logs Access

View production logs:
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs score.mafclub.biz --follow

# Filter by function
vercel logs score.mafclub.biz --output /api/rating
```

## Dashboard Recommendations

### Grafana Dashboard (if using Datadog/Prometheus)
- **Panel 1:** Request rate (line chart)
- **Panel 2:** Error rate (line chart)
- **Panel 3:** Response time percentiles (line chart)
- **Panel 4:** Database query time (histogram)
- **Panel 5:** Cache hit rate (gauge)
- **Panel 6:** Active users (stat)

### Vercel Analytics Dashboard
- Already available at: https://vercel.com/lifeexplorers-projects/mafclubscore/analytics

## Next Steps

1. **Choose monitoring service** based on budget and requirements
2. **Set up environment variables** in Vercel dashboard
3. **Configure alerts** for critical metrics
4. **Create runbook** for common incidents
5. **Schedule weekly reviews** of monitoring data

## Resources

- [Vercel Monitoring Docs](https://vercel.com/docs/concepts/observability)
- [Sentry Vercel Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Datadog Vercel Integration](https://docs.datadoghq.com/integrations/vercel/)
- [OpenAPI Spec](./openapi.yaml) - for API testing
