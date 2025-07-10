// >>> RUNNING CONFIG: medusa.config.ts <<<
// Medusa configuration file (TypeScript)
// This file configures your Medusa backend using the latest v2+ standards.
// TypeScript provides type safety and better developer experience.

import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
// Import environment variables/constants from your local constants file
import {
    ADMIN_CORS,
    AUTH_CORS,
    BACKEND_URL,
    COOKIE_SECRET,
    DATABASE_URL,
    JWT_SECRET,
    REDIS_URL,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    SHOULD_DISABLE_ADMIN,
    STORE_CORS,
    STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET,
    WORKER_MODE,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MEILISEARCH_HOST,
    MEILISEARCH_ADMIN_KEY
} from './src/lib/constants';

// Load environment variables based on the current NODE_ENV
loadEnv(process.env.NODE_ENV || 'development', process.cwd());

// Main Medusa configuration object
const medusaConfig = defineConfig({
    // Project-level configuration (database, Redis, HTTP, etc.)
    projectConfig: {
        databaseUrl: DATABASE_URL || '', // Ensure string type
        databaseLogging: false, // Disable SQL query logging for production
        redisUrl: REDIS_URL || '', // Ensure string type
        workerMode: WORKER_MODE || 'server', // Ensure string type, default to 'server'
        http: {
            adminCors: ADMIN_CORS || '', // Ensure string type
            authCors: AUTH_CORS || '',   // Ensure string type
            storeCors: STORE_CORS || '', // Ensure string type
            jwtSecret: JWT_SECRET, // JWT secret for authentication
            cookieSecret: COOKIE_SECRET // Cookie secret for session cookies
        }
    },
    // Admin dashboard configuration
    admin: {
        backendUrl: BACKEND_URL, // URL for the admin backend
        disable: SHOULD_DISABLE_ADMIN, // Optionally disable admin (for worker instances)
    },
    // Modules configuration (file storage, event bus, notifications, payments, etc.)
    modules: [
        // File storage module (MinIO or local)
        {
            key: Modules.FILE,
            resolve: '@medusajs/file',
            options: {
                providers: [
                    // Use MinIO if all credentials are present, otherwise fallback to local
                    ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
                        resolve: './src/modules/minio-file',
                        id: 'minio',
                        options: {
                            endPoint: MINIO_ENDPOINT,
                            accessKey: MINIO_ACCESS_KEY,
                            secretKey: MINIO_SECRET_KEY,
                            bucket: MINIO_BUCKET // Optional, default: medusa-media
                        }
                    }] : [{
                        resolve: '@medusajs/file-local',
                        id: 'local',
                        options: {
                            upload_dir: 'static',
                            backend_url: `${BACKEND_URL}/static`
                        }
                    }])
                ]
            }
        },
        // Redis event bus and workflow engine modules (if Redis is configured)
        ...(REDIS_URL ? [{
            key: Modules.EVENT_BUS,
            resolve: '@medusajs/event-bus-redis',
            options: {
                redisUrl: REDIS_URL
            }
        },
        {
            key: Modules.WORKFLOW_ENGINE,
            resolve: '@medusajs/workflow-engine-redis',
            options: {
                redis: {
                    url: REDIS_URL,
                }
            }
        }] : []),
        // Notification modules (SendGrid and/or Resend)
        ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            key: Modules.NOTIFICATION,
            resolve: '@medusajs/notification',
            options: {
                providers: [
                    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
                        resolve: '@medusajs/notification-sendgrid',
                        id: 'sendgrid',
                        options: {
                            channels: ['email'],
                            api_key: SENDGRID_API_KEY,
                            from: SENDGRID_FROM_EMAIL,
                        }
                    }] : []),
                    ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
                        resolve: './src/modules/email-notifications',
                        id: 'resend',
                        options: {
                            channels: ['email'],
                            api_key: RESEND_API_KEY,
                            from: RESEND_FROM_EMAIL,
                        },
                    }] : []),
                ]
            }
        }] : []),
        // Stripe payment module (if Stripe credentials are present)
        ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
            key: Modules.PAYMENT,
            resolve: '@medusajs/payment',
            options: {
                providers: [
                    {
                        resolve: '@medusajs/payment-stripe',
                        id: 'stripe',
                        options: {
                            apiKey: STRIPE_API_KEY,
                            webhookSecret: STRIPE_WEBHOOK_SECRET,
                            // automatic_payment_methods: true,
                        },
                    },
                ],
            },
        }] : [])
    ],
    // Plugins configuration (e.g., MeiliSearch)
    plugins: [
        ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
            resolve: '@rokmohar/medusa-plugin-meilisearch',
            options: {
                config: {
                    host: MEILISEARCH_HOST,
                    apiKey: MEILISEARCH_ADMIN_KEY
                },
                settings: {
                    products: {
                        type: 'products',
                        enabled: true,
                        fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
                        indexSettings: {
                            searchableAttributes: ['title', 'description', 'variant_sku'],
                            displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
                            filterableAttributes: ['id', 'handle'],
                        },
                        primaryKey: 'id',
                    }
                }
            }
        }] : [])
    ]
});

// Optionally log the config for debugging (remove in production)
console.log(JSON.stringify(medusaConfig, null, 2));

// Export the config as default (TypeScript/ESM style)
export default medusaConfig; 