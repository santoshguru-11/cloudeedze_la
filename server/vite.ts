import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { fileURLToPath } from 'node:url';
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { IoT1ClickDevicesService } from "aws-sdk";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const host = req.get('host');
    const requestPath = req.path;

    // Skip API routes - let them be handled by the API middleware
    if (requestPath.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "client",
        "index.html",
      );

      // Domain-based routing for development
    // Handle main domain (cloudedze.ai) - redirect root to calculator
    if (host === 'cloudedze.ai' || host === 'www.cloudedze.ai') {
      if (requestPath === '/') {
        return res.redirect(301, '/calculator');
      }
    }
      
      // Handle app subdomain (app.cloudeedze.ai) - serve login page for /login
      if (host === 'app.cloudeedze.ai') {
        if (requestPath === '/login' || requestPath.startsWith('/login')) {
          // always reload the index.html file from disk incase it changes
          let template = await fs.promises.readFile(clientTemplate, "utf-8");
          template = template.replace(
            `src="/src/main.tsx"`,
            `src="/src/main.tsx?v=${nanoid()}"`,
          );
          const page = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(page);
          return;
        }
        // Redirect other routes to main domain
        return res.redirect(301, `https://cloudedze.ai${requestPath}`);
      }

      // Default behavior for development
      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files first
  app.use(express.static(distPath));
  
  // Domain-based static file serving
  app.use("*", (req, res, next) => {
    const host = req.get('host');
    const requestPath = req.path;
    
    // Skip API routes
    if (requestPath.startsWith("/api")) {
      return next();
    }
    
    // Handle main domain (cloudedze.ai) - redirect root to calculator
    if (host === 'cloudedze.ai' || host === 'www.cloudedze.ai') {
      if (requestPath === '/') {
        return res.redirect(301, '/calculator');
      }
    }
    
    // Handle app subdomain (app.cloudeedze.ai) - serve login page for /login
    if (host === 'app.cloudeedze.ai') {
      if (requestPath === '/login' || requestPath.startsWith('/login')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.sendFile(path.resolve(distPath, "index.html"));
      }
      // Redirect other routes to main domain
      return res.redirect(301, `https://cloudedze.ai${requestPath}`);
    }
    
    // Default fallback
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
