require("dotenv").config();
const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("./db");

const app = express();
const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.startsWith("change_me")) {
    console.warn("⚠  Set a strong JWT_SECRET in server/.env before deploying.");
}

app.use(express.json({ limit: "20kb" }));

/* ---------- static site (only public folders; server/ and database/ stay private) ---------- */
app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));
app.use("/assets", express.static(path.join(ROOT, "assets")));

["index", "about", "services", "contact", "login", "register"].forEach(page => {
    app.get(`/${page}.html`, (req, res) => res.sendFile(path.join(ROOT, `${page}.html`)));
});
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

/* ---------- helpers ---------- */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again later." }
});

const emailRe = /^[^ @]+@[^ @]+\.[^ @]+$/;

function signToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not signed in." });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Session expired. Please log in again." });
    }
}

/* ---------- API ---------- */
app.post("/api/register", authLimiter, async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const mobile = String(req.body.mobile || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const username = String(req.body.username || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (name.length < 3 || name.length > 100) return res.status(400).json({ error: "Please enter your full name." });
        if (!/^[0-9]{10}$/.test(mobile)) return res.status(400).json({ error: "Enter a valid 10-digit mobile number." });
        if (!emailRe.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
        if (username.length < 4 || username.length > 50) return res.status(400).json({ error: "Username must contain at least 4 characters." });
        if (password.length < 6) return res.status(400).json({ error: "Password must contain at least 6 characters." });

        const [existing] = await pool.execute(
            "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
            [email, username]
        );
        if (existing.length) return res.status(409).json({ error: "Email or username is already registered." });

        const hash = await bcrypt.hash(password, 10);
        await pool.execute(
            "INSERT INTO users (name, mobile, email, username, password_hash) VALUES (?, ?, ?, ?, ?)",
            [name, mobile, email, username, hash]
        );

        res.status(201).json({ message: "Account created." });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email or username is already registered." });
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

app.post("/api/login", authLimiter, async (req, res) => {
    try {
        const login = String(req.body.login || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        if (!login || !password) return res.status(400).json({ error: "Please enter username/email and password." });

        const [rows] = await pool.execute(
            "SELECT id, name, email, username, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1",
            [login, login]
        );

        const user = rows[0];
        const ok = user && await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: "Invalid username/email or password." });

        res.json({
            token: signToken(user),
            user: { id: user.id, name: user.name, email: user.email, username: user.username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

/* Placeholder: always answers the same way so it can't be used to discover which emails are registered.
   No email is actually sent yet — plug in nodemailer/SendGrid here when you need real resets. */
app.post("/api/forgot-password", authLimiter, (req, res) => {
    const email = String(req.body.email || "").trim();
    if (!emailRe.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
    res.json({ message: "If that email is registered, a reset link will be sent." });
});

app.get("/api/me", requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, name, email, username, mobile, created_at FROM users WHERE id = ?",
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: "User not found." });
        res.json({ user: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error." });
    }
});

app.post("/api/contact", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many messages. Please try later." } }), async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim();
        const message = String(req.body.message || "").trim();

        if (!name || name.length > 100) return res.status(400).json({ error: "Please enter your name." });
        if (!emailRe.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
        if (!message || message.length > 3000) return res.status(400).json({ error: "Please enter a message (max 3000 characters)." });

        await pool.execute(
            "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)",
            [name, email, message]
        );
        res.status(201).json({ message: "Message received." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

app.listen(PORT, () => console.log(`ABC Tech running at http://localhost:${PORT}`));
