export async function GET() {
    return Response.json({
        APP_URL: process.env.APP_URL,
        SERVER_URL: process.env.SERVER_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
        SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,
        SALESFORCE_CLIENT_ID: process.env.SALESFORCE_CLIENT_ID,
        SALESFORCE_REDIRECT_URI: process.env.SALESFORCE_REDIRECT_URI,
        ATLASSIAN_CLIENT_ID: process.env.ATLASSIAN_CLIENT_ID,
        ATLASSIAN_REDIRECT_URI: process.env.ATLASSIAN_REDIRECT_URI,
    });
}