# ABC Tech — Company Website (front end + Node/MySQL backend)

```
ABC-Tech/
├── index.html · about.html · services.html · contact.html · login.html · register.html
├── css/style.css            shared styles (page-specific CSS is still inline in each page)
├── js/
│   ├── script.js            shared: API helper, login state in nav, services search, contact form
│   ├── login.js             login tab, particles, tabs, forgot-password modal
│   └── register.js          register tab: password strength, validation, signup
├── assets/img/              home-bg.jpg, login-bg.jpg
├── server/                  Express API + static file server (server.js, db.js, .env)
└── database/abc_tech.sql    MySQL schema (users, contact_messages)
```

## Run it

1. **Database** — `mysql -u root -p < database/abc_tech.sql`
2. **Config** — edit `server/.env` (DB password, and a long random `JWT_SECRET`)
3. **Start**
   ```bash
   cd server
   npm install
   npm start
   ```
4. Open **http://localhost:3000**

Open the site through the server (not by double-clicking the HTML files) so the forms reach the API.

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/register` | create account (bcrypt-hashed password) |
| POST | `/api/login` | returns a JWT + user |
| POST | `/api/forgot-password` | placeholder — sends no email yet |
| GET  | `/api/me` | current user (needs `Authorization: Bearer <token>`) |
| POST | `/api/contact` | stores a contact-form message |

## Notes

- Passwords are hashed server-side; the old localStorage user list is gone.
- Login errors are intentionally generic ("Invalid username/email or password").
- Never commit `server/.env` (already in `.gitignore`).
- Contact messages are saved to the `contact_messages` table; view them with `SELECT * FROM contact_messages;`.
