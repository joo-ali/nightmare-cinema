export const resetPasswordEmailTemplate =
  function (
    link,
    name
  ) {
    return `
    <!doctype html>

    <html>

    <head>
      <meta charset="UTF-8">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >
    </head>

    <body
      style="
        margin:0;
        padding:0;
        background:#0e0e0f;
        font-family:Arial,Helvetica,sans-serif;
      "
    >

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          background:#0e0e0f;
          padding:40px 15px;
        "
      >

        <tr>

          <td align="center">

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                max-width:600px;
                background:#181819;
                border:1px solid #302b22;
                border-radius:16px;
                overflow:hidden;
              "
            >

              <tr>

                <td
                  align="center"
                  style="
                    padding:34px 24px 24px;
                    border-bottom:1px solid #302b22;
                  "
                >

                  <div
                    style="
                      color:#d6a84b;
                      font-size:30px;
                      font-weight:bold;
                      letter-spacing:1px;
                    "
                  >
                    NIGHTMARE CINEMA
                  </div>

                  <div
                    style="
                      color:#8f8b84;
                      font-size:13px;
                      margin-top:8px;
                    "
                  >
                    Royal Mall
                  </div>

                </td>

              </tr>

              <tr>

                <td
                  style="
                    padding:32px 38px 18px;
                    color:#ffffff;
                  "
                >

                  <h1
                    style="
                      margin:0 0 14px;
                      font-size:25px;
                    "
                  >
                    Reset your password
                  </h1>

                  <p
                    style="
                      color:#b8b8b8;
                      font-size:15px;
                      line-height:1.7;
                      margin:0;
                    "
                  >
                    Hi ${name}, we received a request to reset your Nightmare Cinema password.
                  </p>

                </td>

              </tr>

              <tr>

                <td
                  align="center"
                  style="
                    padding:18px 30px 30px;
                  "
                >

                  <a
                    href="${link}"
                    style="
                      display:inline-block;
                      background:#d6a84b;
                      color:#111111;
                      text-decoration:none;
                      padding:14px 30px;
                      border-radius:8px;
                      font-size:15px;
                      font-weight:bold;
                    "
                  >
                    Reset Password
                  </a>

                </td>

              </tr>

              <tr>

                <td
                  style="
                    padding:0 38px 28px;
                  "
                >

                  <p
                    style="
                      color:#8f8b84;
                      font-size:12px;
                      line-height:1.6;
                    "
                  >
                    This link expires in 15 minutes and can only be used once.
                  </p>

                  <p
                    style="
                      color:#8f8b84;
                      font-size:12px;
                      line-height:1.6;
                      margin-bottom:6px;
                    "
                  >
                    If the button does not work, open this link:
                  </p>

                  <a
                    href="${link}"
                    style="
                      color:#d6a84b;
                      font-size:11px;
                      word-break:break-all;
                    "
                  >
                    ${link}
                  </a>

                </td>

              </tr>

              <tr>

                <td
                  align="center"
                  style="
                    border-top:1px solid #302b22;
                    padding:20px 30px;
                    color:#666666;
                    font-size:12px;
                  "
                >
                  If you did not request a password reset, you can ignore this email.
                </td>

              </tr>

            </table>

          </td>

        </tr>

      </table>

    </body>

    </html>
    `;
  };
