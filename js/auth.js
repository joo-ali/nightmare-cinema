const API_URL = "https://nightmare-cinema.vercel.app";

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const message =
            document.getElementById("registerMessage");

        try {

            const response = await fetch(
                `${API_URL}/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.message || "Registration failed";

                return;
            }

            message.textContent =
                "Account created. Check your email to verify your account.";

            registerForm.reset();

        } catch (error) {

            message.textContent =
                "Cannot connect to server";

        }

    });

}

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        try {

            const response = await fetch(
                `${API_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.message || "Login failed";

                return;
            }

            localStorage.setItem(
                "nightmareToken",
                data.token
            );

            localStorage.setItem(
                "nightmareUser",
                JSON.stringify(data.user)
            );

            window.location.href = "index.html";

        } catch (error) {

            message.textContent =
                "Cannot connect to server";

        }

    });

}

const params = new URLSearchParams(
  window.location.search
);

const verified = params.get("verified");

if (verified === "1") {
  const message =
    document.getElementById("loginMessage");

  if (message) {
    message.textContent =
      "Email verified successfully. You can sign in now.";
  }
}

if (verified === "0") {
  const message =
    document.getElementById("loginMessage");

  if (message) {
    message.textContent =
      "Verification link is invalid or expired.";
  }
}

function initAuthTabs() {
  var tabs = qsa("[data-auth-tab]");
  if (!tabs.length) return;

  tabs.forEach(function (button) {
    button.addEventListener("click", function () {
      tabs.forEach(function (item) { item.classList.remove("active"); });
      this.classList.add("active");
      var type = this.dataset.authTab;
      qs("#loginPanel").classList.toggle("d-none", type !== "login");
      qs("#registerPanel").classList.toggle("d-none", type !== "register");
    });
  });
}

initAuthTabs();
