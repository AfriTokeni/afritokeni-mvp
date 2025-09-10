# Newsletter Email Setup Guide

## Overview
This guide explains how to set up automated email sending for newsletter subscriptions using Juno serverless functions and Resend email service.

## Setup Steps

### 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Create a new API key in your dashboard
3. Copy the API key (starts with `re_`)

### 2. Domain Configuration
**Option A: Use Resend's Domain (Easiest)**
- Use `onboarding@resend.dev` as the sender email
- No domain verification needed
- Good for testing

**Option B: Use Your Namecheap Domain (Recommended for Production)**
1. Add your domain to Resend
2. Add the required DNS records to your Namecheap domain:
   - SPF record: `v=spf1 include:_spf.resend.com ~all`
   - DKIM record: (provided by Resend)
   - DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`

### 3. Environment Variables
Add to your `.env` file:
```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM_DOMAIN=yourdomain.com  # or use resend.dev for testing
```

### 4. Deploy Functions
```bash
# Build and deploy your satellite with functions
juno deploy

# Or for development
juno dev
```

## How It Works

1. **User subscribes** → Email saved to `email_subscriptions` collection
2. **Juno function triggers** → `onSetDoc` hook detects new subscription
3. **Welcome email sent** → Resend API sends branded welcome email
4. **User receives** → Professional welcome email with AfriTokeni branding

## Email Template Features

- **Responsive design** - Works on all devices
- **Professional branding** - AfriTokeni colors and styling
- **Welcome content** - Explains what subscribers will receive
- **Call-to-action** - Link to visit the platform
- **Social links** - Connect on social media
- **Unsubscribe info** - Professional footer

## Testing

1. Go to your landing page
2. Enter an email address in the newsletter signup
3. Check the email inbox for the welcome message
4. Verify the email appears professional and branded

## Troubleshooting

### Function not triggering:
- Check Juno console for function deployment status
- Verify the collection name matches (`email_subscriptions`)
- Check function logs in Juno console

### Email not sending:
- Verify RESEND_API_KEY is set correctly
- Check domain verification status in Resend dashboard
- Review function logs for error messages

### Email in spam:
- Complete domain verification with all DNS records
- Use a professional sender name and email
- Avoid spam trigger words in subject/content

## Production Checklist

- [ ] Domain verified in Resend
- [ ] DNS records configured in Namecheap
- [ ] Environment variables set
- [ ] Functions deployed successfully
- [ ] Test email sent and received
- [ ] Email deliverability tested
- [ ] Unsubscribe mechanism implemented (future)

## Cost Estimate

**Resend Pricing:**
- Free tier: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- Very cost-effective for newsletter use

**Juno Functions:**
- Included in Juno hosting
- Pay per execution (very low cost)
- Scales automatically

## Next Steps

1. Set up Resend account and get API key
2. Configure domain (start with resend.dev for testing)
3. Add environment variables
4. Deploy and test the functionality
5. Monitor email deliverability and engagement
