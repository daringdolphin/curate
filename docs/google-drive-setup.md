# Google Drive API Setup

To use the Curate feature, you need to set up Google Drive API credentials.

## Prerequisites

1. A Google Cloud Project
2. Google Drive API enabled
3. Google Picker API enabled

## Setup Steps

### 1. Enable APIs

In the Google Cloud Console:
1. Go to APIs & Services > Library
2. Search for and enable:
   - Google Drive API
   - Google Picker API

### 2. Create API Key

1. Go to APIs & Services > Credentials
2. Click "Create credentials" > "API key"
3. Copy the API key
4. (Optional) Restrict the key to only the APIs you need

### 3. Create OAuth 2.0 Client ID

1. Go to APIs & Services > Credentials
2. Click "Create credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:3000`
   - For production: your actual domain
5. Copy the Client ID

### 4. Set Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_API_KEY="your-api-key"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id"
```

## Testing

1. Start your development server: `pnpm dev`
2. Navigate to `/curate`
3. Click "Pick Folder" to test the Google Drive integration

## Troubleshooting

- **"Configuration Required" error**: Check that environment variables are set correctly
- **OAuth errors**: Verify the client ID and that your domain is in the authorized origins
- **API errors**: Ensure the Google Drive and Picker APIs are enabled in your project 