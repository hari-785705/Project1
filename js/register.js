/* Register tab: password strength + validation + signup. Needs script.js and login.js first. */

const password = document.getElementById("password");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

password.addEventListener("input", () => {
    const value = password.value;
    let score = 0;

    if (value.length >= 6) score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const levels = [
        ["0%", "Password strength"], ["20%", "Very Weak"], ["40%", "Weak"],
        ["60%", "Medium"], ["80%", "Strong"], ["100%", "Very Strong"]
    ];
    const colors = ["", "#ff5555", "#ff8c42", "#facc15", "#60a5fa", "#4ade80"];
    const level = Math.min(score, 5);

    strengthBar.style.width = levels[level][0];
    strengthText.textContent = levels[level][1];
    strengthBar.style.background = colors[level];
});

const registerForm = document.getElementById("registerForm");

function showRegisterError(message) {
    const error = document.getElementById("registerError");
    error.textContent = message;
    error.style.display = "block";
}

registerForm.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const username = document.getElementById("username").value.trim().toLowerCase();
    const pass = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;
    const error = document.getElementById("registerError");
    const success = document.getElementById("registerSuccess");
    const btn = document.getElementById("registerBtn");

    error.style.display = "none";
    success.style.display = "none";

    if (name.length < 3) return showRegisterError("Please enter your full name.");
    if (!/^[0-9]{10}$/.test(mobile)) return showRegisterError("Enter a valid 10-digit mobile number.");
    if (!/^[^ ]+@[^ ]+\.[^ ]+$/.test(email)) return showRegisterError("Please enter a valid email address.");
    if (username.length < 4) return showRegisterError("Username must contain at least 4 characters.");
    if (pass.length < 6) return showRegisterError("Password must contain at least 6 characters.");
    if (pass !== confirm) return showRegisterError("Passwords do not match.");

    btn.disabled = true;
    try {
        await api("/api/register", { name, mobile, email, username, password: pass });

        success.textContent = "✓ Account created successfully!";
        success.style.display = "block";
        registerForm.reset();
        strengthBar.style.width = "0%";
        strengthText.textContent = "Password strength";

        setTimeout(() => {
            activateTab("login");
            const ok = document.getElementById("loginSuccess");
            ok.textContent = "✓ Account created. You can login now.";
            ok.style.display = "block";
        }, 1200);
    } catch (err) {
        showRegisterError(err.message);
    } finally {
        btn.disabled = false;
    }
});
