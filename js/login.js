/* Login page: particles, tabs, password toggle, login, forgot password. Needs script.js first. */

/* PARTICLES */
const particleHost = document.getElementById("particles");
for (let i = 0; i < 30; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "vw";
    p.style.bottom = "-10px";
    p.style.animationDuration = (7 + Math.random() * 10) + "s";
    p.style.animationDelay = Math.random() * 8 + "s";
    particleHost.appendChild(p);
}

/* TABS */
const tabs = document.getElementById("tabs");
const tabButtons = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

function activateTab(name) {
    tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    panels.forEach(panel => panel.classList.toggle("active", panel.id === name + "Form"));
    tabs.classList.toggle("register", name === "register");
}

tabButtons.forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));

document.querySelectorAll("[data-switch]").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        activateTab(link.dataset.switch);
    });
});

if (window.location.hash === "#register") activateTab("register");

/* PASSWORD SHOW/HIDE */
document.querySelectorAll(".eye").forEach(eye => {
    eye.addEventListener("click", () => {
        const input = document.getElementById(eye.dataset.target);
        if (input.type === "password") {
            input.type = "text";
            eye.textContent = "🙈";
        } else {
            input.type = "password";
            eye.textContent = "👁";
        }
    });
});

/* LOGIN */
const loginForm = document.getElementById("loginForm");

function showLoginError(message) {
    const error = document.getElementById("loginError");
    error.textContent = message;
    error.style.display = "block";
}

loginForm.addEventListener("submit", async e => {
    e.preventDefault();

    const login = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPassword").value;
    const error = document.getElementById("loginError");
    const success = document.getElementById("loginSuccess");
    const btn = document.getElementById("loginBtn");

    error.style.display = "none";
    success.style.display = "none";

    if (!login || !pass) {
        showLoginError("Please enter username/email and password.");
        return;
    }

    btn.disabled = true;
    try {
        const data = await api("/api/login", { login, password: pass });
        Auth.save(data.token, data.user, document.getElementById("remember").checked);

        success.textContent = "✓ Login successful! Welcome, " + data.user.name;
        success.style.display = "block";
        btn.textContent = "Login Successful ✓";

        setTimeout(() => { window.location.href = "index.html"; }, 1200);
    } catch (err) {
        showLoginError(err.message);
        btn.disabled = false;
    }
});

/* FORGOT PASSWORD */
const forgotModal = document.getElementById("forgotModal");

document.getElementById("forgotBtn").addEventListener("click", () => { forgotModal.style.display = "flex"; });
document.getElementById("closeModal").addEventListener("click", () => { forgotModal.style.display = "none"; });
forgotModal.addEventListener("click", e => { if (e.target === forgotModal) forgotModal.style.display = "none"; });

document.getElementById("resetBtn").addEventListener("click", async () => {
    const email = document.getElementById("resetEmail").value.trim();
    const error = document.getElementById("resetError");
    const success = document.getElementById("resetSuccess");

    error.style.display = "none";
    success.style.display = "none";

    if (!/^[^ ]+@[^ ]+\.[^ ]+$/.test(email)) {
        error.textContent = "Please enter a valid email address.";
        error.style.display = "block";
        return;
    }

    try {
        const data = await api("/api/forgot-password", { email });
        success.textContent = "✓ " + data.message;
        success.style.display = "block";
    } catch (err) {
        error.textContent = err.message;
        error.style.display = "block";
    }
});
