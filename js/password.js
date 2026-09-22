const PASSWORD_API_URL =
  "https://nightmare-cinema.vercel.app";

const forgotPasswordForm =
  document.getElementById(
    "forgotPasswordForm"
  );

if (forgotPasswordForm) {

  forgotPasswordForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const email =
        document
          .getElementById(
            "forgotEmail"
          )
          .value
          .trim();

      const message =
        document.getElementById(
          "forgotMessage"
        );

      const button =
        forgotPasswordForm
          .querySelector(
            'button[type="submit"]'
          );

      button.disabled = true;
      button.textContent =
        "Sending...";

      message.textContent = "";

      try {

        const response =
          await fetch(
            `${PASSWORD_API_URL}/auth/forgot-password`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  email
                })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Could not send reset link"
          );
        }

        message.textContent =
          data.message;

        forgotPasswordForm.reset();

      } catch (error) {

        message.textContent =
          error.message;

      } finally {

        button.disabled = false;

        button.textContent =
          "Send reset link";
      }
    }
  );
}

const resetPasswordForm =
  document.getElementById(
    "resetPasswordForm"
  );

if (resetPasswordForm) {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const token =
    params.get("token");

  const message =
    document.getElementById(
      "resetMessage"
    );

  const button =
    document.getElementById(
      "resetPasswordButton"
    );

  if (!token) {

    message.textContent =
      "Invalid password reset link.";

    button.disabled = true;
  }

  resetPasswordForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      if (!token) {
        return;
      }

      const password =
        document
          .getElementById(
            "newPassword"
          )
          .value;

      const confirmPassword =
        document
          .getElementById(
            "confirmPassword"
          )
          .value;

      if (
        password !==
        confirmPassword
      ) {

        message.textContent =
          "Passwords do not match.";

        return;
      }

      if (
        password.length < 6
      ) {

        message.textContent =
          "Password must be at least 6 characters.";

        return;
      }

      button.disabled = true;

      button.textContent =
        "Resetting...";

      message.textContent = "";

      try {

        const response =
          await fetch(
            `${PASSWORD_API_URL}/auth/reset-password/${encodeURIComponent(token)}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  password
                })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Could not reset password"
          );
        }

        localStorage.removeItem(
          "nightmareToken"
        );

        localStorage.removeItem(
          "nightmareUser"
        );

        message.textContent =
          "Password changed successfully. Redirecting to sign in...";

        setTimeout(
          function () {
            window.location.href =
              "auth.html";
          },
          1500
        );

      } catch (error) {

        message.textContent =
          error.message;

        button.disabled = false;

        button.textContent =
          "Reset password";
      }
    }
  );
}
