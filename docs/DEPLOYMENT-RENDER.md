# Deploying Backend to Render

This guide provides step-by-step instructions for deploying the Express/Node.js backend to Render.

## Prerequisites

- A Render account (free tier available at https://render.com)
- MongoDB Atlas database configured and running
- GitHub repository with the code

## Deployment Steps

### 1. Create a Web Service on Render

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository `itsmardochee/Planit`
4. Authorize Render to access the repository if needed

### 2. Configure Service Settings

- **Name**: `planit-api` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `Frankfurt (EU Central)` or `Oregon (US West)`)
- **Branch**: `main` (production branch)
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (or upgrade as needed)

### 3. Environment Variables

In the **Environment** section, add the following variables:

| Variable Name | Value                                                                            | Description                                                    |
| ------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`    | `production`                                                                     | Sets environment to production                                 |
| `PORT`        | `5000`                                                                           | Port number (Render auto-assigns, but this is for consistency) |
| `MONGO_URI`   | `mongodb+srv://user:pass@cluster.mongodb.net/planit?retryWrites=true&w=majority` | Your MongoDB Atlas connection string                           |
| `JWT_SECRET`  | `your-super-secret-jwt-key-here`                                                 | Secret key for JWT tokens (generate a strong random string)    |
| `API_URL`     | `https://planit-api.onrender.com`                                                | Your Render service URL (update after deployment)              |

**Important Notes:**

- Replace `MONGO_URI` with your actual MongoDB Atlas connection string
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- The `API_URL` will be your Render service URL (e.g., `https://planit-api.onrender.com`)

### 4. MongoDB Atlas Configuration

Ensure your MongoDB Atlas cluster allows connections from Render:

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (`0.0.0.0/0`) or add Render's IP ranges
5. Click **"Confirm"**

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your application
3. Monitor the deployment logs for any errors
4. Once deployed, note your service URL (e.g., `https://planit-api.onrender.com`)

### 6. Update API_URL Environment Variable

After deployment:

1. Copy your Render service URL
2. Go back to **Environment** variables
3. Update `API_URL` to match your actual URL (e.g., `https://planit-api.onrender.com`)
4. Save changes (this will trigger a redeploy)

### 7. Test Your API

#### Test Health Endpoint

```bash
curl https://planit-api.onrender.com/api/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2025-12-23T12:00:00.000Z"
}
```

#### Access Swagger Documentation

Open in browser:

```
https://planit-api.onrender.com/api-docs
```

You should see the Swagger UI with all API endpoints documented.

### 8. Configure Frontend (Vercel)

Update your frontend environment variable on Vercel:

- Variable: `VITE_API_URL`
- Value: `https://planit-api.onrender.com/api`

### 9. CORS Configuration

The backend is already configured to accept requests from any origin in production. If you want to restrict it to only your Vercel frontend:

Edit `server/src/index.js`:

```javascript
// Middleware
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://your-app.vercel.app', 'https://planit-api.onrender.com']
      : '*',
  credentials: true,
};
app.use(cors(corsOptions));
```

## Automatic Deployments

Render automatically deploys when you push to the `main` branch. To disable this:

1. Go to **Settings** → **Build & Deploy**
2. Toggle **"Auto-Deploy"** off

## Monitoring & Logs

- **Logs**: View real-time logs in the Render dashboard under **Logs** tab
- **Metrics**: Monitor CPU, Memory, and Bandwidth usage in **Metrics** tab
- **Events**: Track deployment history in **Events** tab

## Troubleshooting

### Build Fails

**Problem**: `npm install` fails

- **Solution**: Check `package.json` for invalid dependencies
- Run `npm install` locally to test
- Check Node version compatibility

**Problem**: Missing environment variables

- **Solution**: Verify all required env vars are set in Render dashboard
- Check for typos in variable names

### Runtime Errors

**Problem**: MongoDB connection fails

- **Solution**:
  - Verify `MONGO_URI` is correct
  - Check MongoDB Atlas Network Access allows Render IPs
  - Test connection string locally

**Problem**: CORS errors

- **Solution**:
  - Update CORS configuration to include Vercel domain
  - Verify `API_URL` in frontend matches Render URL

**Problem**: Swagger not loading

- **Solution**:
  - Verify `API_URL` environment variable is set correctly
  - Check that `API_URL` matches your Render service URL
  - Clear browser cache and reload

### Free Tier Limitations

**Problem**: Service spins down after inactivity (15 min)

- **Solution**:
  - Upgrade to paid tier for always-on service
  - Or use a keep-alive service (ping endpoint every 10 min)
  - Note: First request after spin-down takes 30-60s

## Security Best Practices

1. **Never commit sensitive data** to Git (use `.env` and `.gitignore`)
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Restrict CORS origins** in production to known domains
4. **Enable MongoDB Atlas IP whitelist** (avoid `0.0.0.0/0` in production)
5. **Rotate secrets regularly** (JWT_SECRET, database passwords)

## Useful Commands

Generate strong JWT secret:

```bash
openssl rand -base64 32
```

Test API endpoints:

```bash
# Health check
curl https://planit-api.onrender.com/api/health

# Register user
curl -X POST https://planit-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Configure environment variables
3. ✅ Test API and Swagger documentation
4. 📝 Deploy frontend to Vercel (see [DEPLOYMENT-VERCEL.md](./DEPLOYMENT-VERCEL.md))
5. 📝 Update frontend `VITE_API_URL` to point to Render
6. 📝 Test full application flow (registration, login, CRUD operations)

## Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Project Issues**: https://github.com/itsmardochee/Planit/issues
