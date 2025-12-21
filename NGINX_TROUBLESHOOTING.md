# Nginx 504 Gateway Timeout Troubleshooting

## Quick Checks

### 1. Is Next.js running?
```bash
# Check if process is running on port 3002
sudo netstat -tlnp | grep 3002
# or
sudo ss -tlnp | grep 3002
# or
ps aux | grep "next start"
```

### 2. Check Next.js logs
```bash
# If using PM2
pm2 logs namos_dashboard

# If using systemd
sudo journalctl -u your-service-name -f

# If running directly
# Check where you're running `npm start` and view those logs
```

### 3. Test Next.js directly (bypass nginx)
```bash
# On your server
curl http://localhost:3002
# Should return HTML, not timeout
```

### 4. Check nginx error logs
```bash
sudo tail -f /var/log/nginx/error.log
# Try accessing the site and watch for errors
```

---

## Common Issues & Fixes

### Issue 1: Next.js Not Running
**Solution:**
```bash
# Build the app first
npm run build

# Then start it
npm start
# or with PM2
pm2 start npm --name "namos_dashboard" -- start
```

### Issue 2: Wrong Port in Nginx Config
Your app runs on **port 3002**, so nginx must proxy to `http://localhost:3002` or `http://127.0.0.1:3002`

### Issue 3: Nginx Timeout Too Low
If your app takes time to render, increase nginx timeouts.

### Issue 4: Firewall/SELinux Blocking
```bash
# Check if localhost:3002 is accessible
curl http://127.0.0.1:3002
```

---

## Example Nginx Configuration

Create/edit: `/etc/nginx/sites-available/namos_dashboard`

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change this
    
    # Redirect HTTP to HTTPS (if using SSL)
    # return 301 https://$server_name$request_uri;
    
    # Or if not using SSL yet, use this block:
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Proxy API requests to your backend API server
    location /api/ {
        proxy_pass http://95.111.224.58:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for API calls
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}

# If using SSL/HTTPS:
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com;
#     
#     ssl_certificate /path/to/cert.pem;
#     ssl_certificate_key /path/to/key.pem;
#     
#     location / {
#         proxy_pass http://127.0.0.1:3002;
#         # ... same proxy settings as above
#     }
#     
#     location /api/ {
#         proxy_pass http://95.111.224.58:3001/api/;
#         # ... same proxy settings as above
#     }
# }
```

After editing:
```bash
# Test nginx config
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

## Environment Variables Needed

Make sure these are set when running Next.js in production:

```bash
# In your .env.production or systemd/PM2 environment
NODE_ENV=production
# Optional: If you want to change API base URL
# NEXT_PUBLIC_API_BASE_URL=http://95.111.224.58:3001/api
```

---

## Step-by-Step Debug Process

1. **Verify Next.js is running:**
   ```bash
   curl http://localhost:3002
   ```
   If this fails, Next.js isn't running → fix that first

2. **Check nginx is pointing to correct port:**
   ```bash
   sudo grep -r "proxy_pass" /etc/nginx/sites-enabled/
   ```
   Should show `http://127.0.0.1:3002` or `http://localhost:3002`

3. **Check nginx error logs while accessing site:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Test nginx can reach Next.js:**
   ```bash
   # From server itself
   curl -H "Host: your-domain.com" http://localhost
   ```

