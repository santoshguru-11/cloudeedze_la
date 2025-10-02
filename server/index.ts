import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupAuth } from "./auth.js";

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Domain-based routing middleware (only for redirects, not for serving)
app.use((req, res, next) => {
  const host = req.get('host');
  const path = req.path;
  
  // For app.cloudedze.ai, serve the application directly (no redirects)
  // This allows the frontend router to handle all routes
  if (host === 'app.cloudedze.ai') {
    // Let all requests pass through to be handled by the frontend router
    return next();
  }
  
  // For other domains, handle redirects as needed
  if (host === 'cloudedze.ai' && path.startsWith('/app/')) {
    return res.redirect(301, `https://app.cloudedze.ai${path.replace('/app', '')}`);
  }
  
  // Let all other requests pass through to be handled by static serving
  next();
});

// Set timeout for long-running requests (10 minutes)
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup authentication first
  await setupAuth(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Server error:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log('NODE_ENV:', process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    console.log('Setting up Vite development server');
    await setupVite(app, server);
  } else {
    console.log('Setting up static file serving');
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const useSSL = process.env.USE_SSL === 'true';
  
  if (useSSL) {
    // SSL Configuration
    const sslKeyPath = process.env.SSL_KEY_PATH || path.join(process.cwd(), 'ssl', 'server.key');
    const sslCertPath = process.env.SSL_CERT_PATH || path.join(process.cwd(), 'ssl', 'server.crt');
    
    try {
      // Check if SSL certificates exist
      if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
        const sslOptions = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath)
        };
        
        const httpsServer = https.createServer(sslOptions, app);
        httpsServer.listen(port, "0.0.0.0", () => {
          log(`🔒 HTTPS server serving on port ${port}`);
          log(`🔐 SSL certificates loaded from ${sslKeyPath} and ${sslCertPath}`);
        });
      } else {
        log(`⚠️  SSL certificates not found at ${sslKeyPath} and ${sslCertPath}`);
        log(`📝 Falling back to HTTP server on port ${port}`);
        server.listen(port, "0.0.0.0", () => {
          log(`🌐 HTTP server serving on port ${port}`);
        });
      }
    } catch (error) {
      log(`❌ SSL setup failed: ${error}`);
      log(`📝 Falling back to HTTP server on port ${port}`);
      server.listen(port, "0.0.0.0", () => {
        log(`🌐 HTTP server serving on port ${port}`);
      });
    }
  } else {
    server.listen(port, "0.0.0.0", () => {
      log(`🌐 HTTP server serving on port ${port}`);
    });
  }
})();
