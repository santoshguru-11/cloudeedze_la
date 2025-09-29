#!/bin/bash

# Force cache clear by updating file timestamps and adding cache-busting headers

echo "🔄 Force clearing browser cache..."

# Update timestamps on all static files to force cache refresh
find dist/public -name "*.js" -exec touch {} \;
find dist/public -name "*.css" -exec touch {} \;
find dist/public -name "*.html" -exec touch {} \;

# Add cache-busting query parameters to index.html
sed -i.bak 's/\/assets\/index-[A-Za-z0-9]*\.js/\/assets\/index-B4ctcF7v.js?v='$(date +%s)'/g' dist/public/index.html
sed -i.bak 's/\/assets\/index-[A-Za-z0-9]*\.css/\/assets\/index-DkMPUs3P.css?v='$(date +%s)'/g' dist/public/index.html

# Create a new deployment with cache-busting
echo "📦 Creating cache-busted deployment..."
TEMP_DIR="/tmp/cloudedze-cache-bust"
mkdir -p "$TEMP_DIR"
cp -r dist/public/* "$TEMP_DIR/"

# Add cache-busting headers to nginx config
cat > "$TEMP_DIR/nginx-cache-bust.conf" << 'EOF'
# Cache busting for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# Force no-cache for HTML files
location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
EOF

# Create deployment archive
cd "$TEMP_DIR"
tar -czf cloudedze-cache-bust.tar.gz *

# Upload to server
echo "📤 Uploading cache-busted files..."
scp cloudedze-cache-bust.tar.gz santosh@34.14.198.14:/tmp/

# Deploy with cache clearing
echo "🔧 Deploying with cache clearing..."
ssh santosh@34.14.198.14 << 'EOF'
    cd /tmp
    tar -xzf cloudedze-cache-bust.tar.gz
    
    # Backup current files
    sudo cp -r /var/www/cloudedze/public /var/www/cloudedze/public.backup.$(date +%Y%m%d_%H%M%S)
    
    # Deploy new files
    sudo cp -r * /var/www/cloudedze/public/
    sudo chown -R www-data:www-data /var/www/cloudedze/public 2>/dev/null || true
    sudo chmod -R 755 /var/www/cloudedze/public
    
    # Clear nginx cache
    sudo nginx -s reload
    
    # Add cache-busting headers to nginx config
    sudo tee -a /etc/nginx/sites-available/cloudedze << 'NGINX_EOF'
    
    # Cache busting headers
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
NGINX_EOF
    
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "✅ Cache-busted deployment completed!"
    echo "🌐 Please hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)"
EOF

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Cache clearing deployment completed!"
echo "🔄 Please hard refresh your browser now!"
