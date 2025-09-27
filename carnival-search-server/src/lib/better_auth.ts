import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { DB } from "../db";
import { config } from "../providers/config";
import { account_table, session_table, user_table, verification_table } from "../db/schema";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { UserService } from "../services/user.services";
import CustomError from "../providers/error";

export const better_auth = betterAuth({
    database: drizzleAdapter(DB, {
        provider: "pg",
        schema: {
            user: user_table,
            account: account_table,
            session: session_table,
            verification: verification_table
        }
    }),
    advanced: {
        database: {
            generateId: false
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false
    },
    user: {
        fields: {
            name: "display_name",
            emailVerified: "email_verified",
            createdAt: "created_at",
            updatedAt: "updated_at",
            image: "image_url"
        },
    },
    session: {
        fields: {
            userId: "fk_session_user",
            expiresAt: "expires_at",
            ipAddress: "ip_address",
            userAgent: "user_agent",
            createdAt: "created_at",
            updatedAt: "updated_at"
        },
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    account: {
        fields: {
            userId: "fk_account_user",
            accountId: "account_id",
            providerId: "provider_id",
            accessToken: "access_token",
            refreshToken: "refresh_token",
            accessTokenExpiresAt: "access_token_expires_at",
            refreshTokenExpiresAt: "refresh_token_expires_at",
            idToken: "id_token",
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    },
    verification: {
        fields: {
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    },
    basePath: "/internal/auth/",
    trustedOrigins: [config.frontend_app_url, config.admin_app_url],
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-in/email" && ctx.request?.headers.get("origin") === config.admin_app_url) {
                if (ctx.body?.email !== "admin@usecarnival.com") {
                    throw new CustomError("Unauthorized", 401);
                }
                ctx.body = {}
            }
        }),
        after: createAuthMiddleware(async (ctx) => {
            const user = (ctx.context.returned as any)?.user;
            if (ctx.path === "/sign-up/email" && user?.email && /@lambdatest\.com$/i.test(user.email)) {
                await UserService.checkandUpdateLambdatestUser({ user_id: user.id });
            }
            if (ctx.path === "/callback/:id") {
                const session_user = ctx.context.newSession?.user;
                if (session_user) {
                    if (session_user.email && /@lambdatest\.com$/i.test(session_user.email)) {
                        await UserService.checkandUpdateLambdatestUser({ user_id: session_user.id });
                    }
                }
            }
        }),
    },
    socialProviders: {
        google: {
            clientId: config.google_client_id,
            clientSecret: config.google_client_secret,
            redirectURI: config.google_auth_redirect_uri,
            accessType: "offline",
            prompt: "select_account consent" as any,
        }
    }
});