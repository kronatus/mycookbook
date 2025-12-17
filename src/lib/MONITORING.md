# Monitoring and Error Tracking

## Overview

The monitoring system provides centralized logging, error tracking, and performance monitoring for the Personal Cookbook application.

## Features

- **Error Tracking**: Capture and log errors with context
- **Performance Monitoring**: Track API response times and database queries
- **Structured Logging**: JSON-formatted logs for easy parsing
- **Environment-Aware**: Different behavior for dev vs production
- **Vercel Integration**: Automatic log capture by Vercel platform

## Usage

### Error Logging

```typescript
import { logError } from '@/lib/monitoring';

try {
  await someOperation();
} catch (error) {
  logError(error as Error, {
    userId: user.id,
    url: request.url,
    method: request.method,
    statusCode: 500,
  });
  throw error;
}
```

### Warning Logging

```typescript
import { logWarning } from '@/lib/monitoring';

if (queryDuration > 1000) {
  logWarning('Slow database query detected', {
    query: 'SELECT * FROM recipes',
    duration: queryDuration,
  });
}
```

### Info Logging

```typescript
import { logInfo } from '@/lib/monitoring';

logInfo('Recipe ingestion started', {
  recipeId: recipe.id,
  source: 'url',
});
```

### Performance Tracking

```typescript
import { startTimer } from '@/lib/monitoring';

const endTimer = startTimer('recipe-ingestion');

// Perform operation
await ingestRecipe(url);

// Log duration automatically
endTimer();
```

### API Request Tracking

```typescript
import { trackApiRequest } from '@/lib/monitoring';

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const result = await fetchRecipes();
    const duration = Date.now() - startTime;
    
    trackApiRequest(
      'GET',
      '/api/recipes',
      200,
      duration,
      userId
    );
    
    return Response.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    trackApiRequest(
      'GET',
      '/api/recipes',
      500,
      duration,
      userId
    );
    
    throw error;
  }
}
```

### Async Function Wrapping

```typescript
import { wrapAsync } from '@/lib/monitoring';

const result = await wrapAsync(
  async () => {
    return await fetchRecipes();
  },
  {
    url: '/api/recipes',
    method: 'GET',
  }
);
```

### User Action Tracking

```typescript
import { monitoring } from '@/lib/monitoring';

monitoring.trackUserAction(
  'recipe_created',
  userId,
  {
    recipeId: recipe.id,
    source: 'manual',
  }
);
```

## Log Format

All logs are structured as JSON for easy parsing:

```json
{
  "level": "error",
  "message": "Database query failed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "userId": "user_123",
  "url": "/api/recipes",
  "method": "GET",
  "statusCode": 500,
  "stack": "Error: Connection timeout\n    at ..."
}
```

## Log Levels

- **error**: Critical errors requiring immediate attention
- **warning**: Potential issues that should be monitored
- **info**: General information about system operations
- **performance**: Performance metrics and timing data
- **api_request**: API request logs with response times
- **db_query**: Database query logs with durations
- **user_action**: User interaction tracking

## Viewing Logs

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on "Logs" tab
4. Filter by:
   - Time range
   - Log level
   - Search terms

### Local Development

Logs are printed to console with color coding:
- Errors: Red
- Warnings: Yellow
- Info: Blue
- Performance: Green

### Log Queries

Use Vercel's log search to find specific events:

```
level:error
level:warning duration:>1000
api_request statusCode:500
db_query success:false
```

## Performance Thresholds

The system automatically logs warnings for:

- **Slow API Requests**: > 1000ms
- **Slow Database Queries**: > 500ms

These thresholds can be adjusted in `src/lib/monitoring.ts`.

## Integration with External Services

The monitoring system is designed to integrate with:

### Sentry (Error Tracking)

```typescript
// In src/lib/monitoring.ts
if (this.isProduction) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}
```

### LogRocket (Session Replay)

```typescript
// In src/lib/monitoring.ts
if (this.isProduction) {
  LogRocket.captureException(error, {
    extra: context,
  });
}
```

### DataDog (APM)

```typescript
// In src/lib/monitoring.ts
if (this.isProduction) {
  datadogLogs.logger.error(error.message, {
    error: error,
    ...context,
  });
}
```

## Best Practices

### 1. Always Include Context

```typescript
// Good
logError(error, {
  userId: user.id,
  recipeId: recipe.id,
  operation: 'create_recipe',
});

// Bad
logError(error);
```

### 2. Use Appropriate Log Levels

```typescript
// Critical errors
logError(error, context);

// Potential issues
logWarning('Slow query detected', context);

// General info
logInfo('Recipe created', context);
```

### 3. Track Performance for Critical Operations

```typescript
const endTimer = startTimer('recipe-ingestion');
await ingestRecipe(url);
endTimer();
```

### 4. Don't Log Sensitive Data

```typescript
// Bad - logs password
logInfo('User login', { email, password });

// Good - no sensitive data
logInfo('User login', { email });
```

### 5. Use Structured Data

```typescript
// Good - structured
logError(error, {
  userId: user.id,
  recipeId: recipe.id,
});

// Bad - unstructured
logError(error, {
  message: `User ${user.id} failed to create recipe ${recipe.id}`,
});
```

## Monitoring Checklist

### Daily
- [ ] Check error logs for critical issues
- [ ] Review slow query warnings
- [ ] Monitor API response times

### Weekly
- [ ] Review performance trends
- [ ] Check for recurring errors
- [ ] Analyze user action patterns

### Monthly
- [ ] Review log retention policies
- [ ] Optimize slow queries
- [ ] Update monitoring thresholds

## Troubleshooting

### Logs Not Appearing

1. Check Vercel dashboard for deployment status
2. Verify console.log statements are being called
3. Check log level filters in Vercel dashboard
4. Ensure structured logging format is correct

### Performance Metrics Missing

1. Verify `startTimer()` is being called
2. Check that `endTimer()` is being called
3. Ensure operations are completing successfully
4. Review Vercel function logs

### Error Context Missing

1. Verify context object is being passed
2. Check that context values are serializable
3. Ensure no circular references in context
4. Review error handling code

## Future Enhancements

- [ ] Integration with Sentry for error tracking
- [ ] Integration with LogRocket for session replay
- [ ] Custom dashboards for metrics visualization
- [ ] Automated alerting for critical errors
- [ ] Performance regression detection
- [ ] User behavior analytics

## Requirements

**Validates: Requirements 8.4**
- System maintenance and availability monitoring
- Error tracking and logging
- Performance monitoring
- Health status tracking

## Related Documentation

- `.github/DEPLOYMENT_PIPELINE.md` - Deployment pipeline
- `app/api/health/route.ts` - Health check endpoint
- `scripts/deploy.ts` - Deployment script
