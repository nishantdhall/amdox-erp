export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.PORT ?? '3001', 10),
    globalPrefix: 'api/v1',
    name: 'AMDOX ERP API',
    logLevel: process.env.LOG_LEVEL ?? 'log',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    keycloakUrl: process.env.KEYCLOAK_URL ?? '',
    keycloakRealm: process.env.KEYCLOAK_REALM ?? '',
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  },
  frontend: {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'AMDOX ERP',
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
    keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? '',
    keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? '',
    keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? '',
  },
  email: {
    host: process.env.SMTP_HOST ?? '',
    port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
  },
  forecast: {
    serviceUrl: process.env.FORECAST_SERVICE_URL ?? '',
    modelPath: process.env.MODEL_PATH ?? './models',
    predictionDays: Number.parseInt(process.env.PREDICTION_DAYS ?? '90', 10),
  },
  security: {
    throttleTtl: Number.parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    throttleLimit: Number.parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
})
