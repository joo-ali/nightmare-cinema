export const verificationEmailTemplate = (link, name) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>

    <body style="
        margin:0;
        padding:0;
        background-color:#111111;
        font-family:Arial, Helvetica, sans-serif;
    ">

        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="background-color:#111111; padding:40px 15px;"
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
                            background-color:#1b1b1b;
                            border-radius:14px;
                            overflow:hidden;
                            border:1px solid #333333;
                        "
                    >

                        <tr>
                            <td
                                align="center"
                                style="
                                    padding:35px 20px 20px 20px;
                                "
                            >

                                <h1 style="
                                    margin:0;
                                    color:#d6a84b;
                                    font-size:32px;
                                    letter-spacing:1px;
                                ">
                                    Nightmare Cinema
                                </h1>

                                <p style="
                                    color:#aaaaaa;
                                    margin-top:8px;
                                    font-size:14px;
                                ">
                                    Royal Mall
                                </p>

                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding:20px 40px;
                                color:#ffffff;
                            ">

                                <h2 style="
                                    margin-top:0;
                                    font-size:24px;
                                ">
                                    Welcome, ${name} 🎬
                                </h2>

                                <p style="
                                    color:#cccccc;
                                    font-size:16px;
                                    line-height:1.7;
                                ">
                                    Thanks for creating your Nightmare Cinema account.
                                </p>

                                <p style="
                                    color:#cccccc;
                                    font-size:16px;
                                    line-height:1.7;
                                ">
                                    Please verify your email address before you start booking your movie tickets.
                                </p>

                            </td>
                        </tr>

                        <tr>
                            <td
                                align="center"
                                style="padding:10px 20px 30px 20px;"
                            >

                                <a
                                    href="${link}"
                                    style="
                                        display:inline-block;
                                        background-color:#d6a84b;
                                        color:#111111;
                                        text-decoration:none;
                                        padding:14px 32px;
                                        border-radius:8px;
                                        font-size:16px;
                                        font-weight:bold;
                                    "
                                >
                                    Verify Email
                                </a>

                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding:0 40px 25px 40px;
                            ">

                                <p style="
                                    color:#888888;
                                    font-size:13px;
                                    line-height:1.6;
                                ">
                                    If the button does not work, copy and open this link:
                                </p>

                                <p style="
                                    font-size:12px;
                                    word-break:break-all;
                                ">
                                    <a
                                        href="${link}"
                                        style="color:#d6a84b;"
                                    >
                                        ${link}
                                    </a>
                                </p>

                            </td>
                        </tr>

                        <tr>
                            <td style="
                                border-top:1px solid #333333;
                                padding:20px 40px;
                                text-align:center;
                            ">

                                <p style="
                                    color:#777777;
                                    font-size:12px;
                                    margin:0;
                                ">
                                    This verification link expires in 30 minutes.
                                </p>

                                <p style="
                                    color:#777777;
                                    font-size:12px;
                                    margin-top:8px;
                                ">
                                    © 2026 Nightmare Cinema — Royal Mall
                                </p>

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
