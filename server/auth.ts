import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { DatabaseStorage } from "./storage.js";

const storage = new DatabaseStorage();

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Use PostgreSQL store for sessions
  const PgSession = connectPg(session);
  return session({
    name: 'cloudedze.sid',
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    proxy: true,  // ADDED: Trust nginx proxy
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions'
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password || '');
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.json({
          message: "Registration successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      // Handle errors during authentication
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: "An error occurred during login" });
      }

      // Handle authentication failure
      if (!user) {
        console.log('Login failed:', info?.message || 'Invalid credentials');
        return res.status(401).json({
          message: info?.message || "Invalid email or password"
        });
      }

      // Login the user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login session error:', loginErr);
          return res.status(500).json({ message: "Failed to create session" });
        }

        console.log('Login successful, user:', user);
        console.log('Session ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }

          res.json({
            message: "Login successful",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }
          });
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - Is authenticated:', req.isAuthenticated());
    console.log('Auth check - User:', req.user);
    console.log('Auth check - Cookie:', req.headers.cookie);

    if (req.isAuthenticated()) {
      res.json({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Debug endpoint to test database connection
  app.get("/api/debug/db", async (req, res) => {
    try {
      const userCount = await storage.getUserByEmail('test@example.com');
      res.json({
        message: "Database connection working",
        userExists: !!userCount,
        userEmail: userCount?.email
      });
    } catch (error) {
      res.status(500).json({
        message: "Database error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};
