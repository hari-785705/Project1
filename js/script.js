/* Shared helpers loaded on every page */

const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";

/* Auth storage: "remember me" -> localStorage, otherwise sessionStorage */
const Auth = {
    save(token, user, remember) {
        this.clear();
        const store = remember ? localStorage : sessionStorage;
        store.setItem("abcTechToken", token);
        store.setItem("abcTechUser", JSON.stringify(user));
    },
    token() {
        return localStorage.getItem("abcTechToken") || sessionStorage.getItem("abcTechToken");
    },
    user() {
        const raw = localStorage.getItem("abcTechUser") || sessionStorage.getItem("abcTechUser");
        try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    },
    clear() {
        ["abcTechToken", "abcTechUser"].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
    }
};

async function api(path, body, method) {
    const headers = { "Content-Type": "application/json" };
    if (Auth.token()) headers.Authorization = "Bearer " + Auth.token();

    let res;
    try {
        res = await fetch(API_BASE + path, {
            method: method || (body ? "POST" : "GET"),
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error("Cannot reach the server. Is it running?");
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
}

function showStatus(el, message, ok) {
    if (!el) return;
    el.textContent = message;
    el.className = "form-status " + (ok ? "ok" : "err");
}

document.addEventListener("DOMContentLoaded", () => {
    /* Nav: swap LOGIN for LOGOUT when signed in */
    const user = Auth.user();
    const link = document.querySelector('.nav a[href="login.html"]');

    if (user && link) {
        link.textContent = " LOGOUT (" + user.username + ") ";
        link.href = "#";
        link.addEventListener("click", e => {
            e.preventDefault();
            Auth.clear();
            window.location.href = "index.html";
        });
    }

    /* Services search (services.html only) */
    const searchInput = document.getElementById("serviceSearch");
    if (searchInput) {
        const cards = document.querySelectorAll(".service-card");
        const noResults = document.getElementById("noResults");

        searchInput.addEventListener("input", function () {
            const q = this.value.toLowerCase().trim();
            let visible = 0;

            cards.forEach(card => {
                const match = q === "" || card.getAttribute("data-service").toLowerCase().includes(q);
                card.style.display = match ? "" : "none";
                if (match) visible++;
            });

            noResults.style.display = visible === 0 ? "block" : "none";
        });
    }

    /* Contact form (contact.html only) */
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        const status = document.getElementById("contactStatus");
        const btn = contactForm.querySelector("button[type=submit]");

        contactForm.addEventListener("submit", async e => {
            e.preventDefault();
            btn.disabled = true;
            try {
                await api("/api/contact", {
                    name: document.getElementById("name").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    message: document.getElementById("message").value.trim()
                });
                showStatus(status, "✓ Message sent. We'll get back to you soon.", true);
                contactForm.reset();
            } catch (err) {
                showStatus(status, err.message, false);
            } finally {
                btn.disabled = false;
            }
        });
    }
});
