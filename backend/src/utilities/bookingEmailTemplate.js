function formatBookingDate(
  startTime
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone:
        "Africa/Cairo"
    }
  ).format(
    new Date(startTime)
  );
}

function formatBookingTime(
  startTime
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone:
        "Africa/Cairo"
    }
  ).format(
    new Date(startTime)
  );
}

function money(value) {
  return `EGP ${Number(value).toFixed(2)}`;
}

export const bookingConfirmationEmailTemplate =
  function (booking) {

    const showtime =
      booking.showtime;

    const movie =
      showtime.movie;

    const screen =
      showtime.screen;

    const date =
      formatBookingDate(
        showtime.startTime
      );

    const time =
      formatBookingTime(
        showtime.startTime
      );

    const discountRow =
      booking.discountAmount > 0
        ? `
          <tr>
            <td style="padding:8px 0;color:#a8a8a8;">
              Discount
              ${
                booking.promoCode
                  ? `(${booking.promoCode})`
                  : ""
              }
            </td>

            <td
              align="right"
              style="padding:8px 0;color:#d6a84b;font-weight:bold;"
            >
              - ${money(
                booking.discountAmount
              )}
            </td>
          </tr>
        `
        : "";

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
                max-width:620px;
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
                    padding:34px 24px 22px;
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
                    padding:30px 36px 10px;
                  "
                >

                  <div
                    style="
                      color:#d6a84b;
                      font-size:13px;
                      text-transform:uppercase;
                      letter-spacing:1.5px;
                    "
                  >
                    Booking confirmed
                  </div>

                  <h1
                    style="
                      margin:10px 0 8px;
                      color:#ffffff;
                      font-size:26px;
                    "
                  >
                    Your ticket is ready
                  </h1>

                  <p
                    style="
                      margin:0;
                      color:#b8b8b8;
                      font-size:15px;
                      line-height:1.7;
                    "
                  >
                    Hi ${booking.user.name}, your booking at Nightmare Cinema has been confirmed.
                  </p>

                </td>

              </tr>

              <tr>

                <td
                  style="
                    padding:20px 36px;
                  "
                >

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      background:#101011;
                      border:1px solid #302b22;
                      border-radius:12px;
                    "
                  >

                    <tr>

                      <td
                        style="
                          padding:22px;
                        "
                      >

                        <div
                          style="
                            color:#8f8b84;
                            font-size:12px;
                            text-transform:uppercase;
                            letter-spacing:1px;
                          "
                        >
                          Movie
                        </div>

                        <div
                          style="
                            color:#ffffff;
                            font-size:22px;
                            font-weight:bold;
                            margin-top:6px;
                          "
                        >
                          ${movie.title}
                        </div>

                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="
                            margin-top:22px;
                            color:#ffffff;
                            font-size:14px;
                          "
                        >

                          <tr>
                            <td
                              style="
                                padding:8px 0;
                                color:#8f8b84;
                              "
                            >
                              Date
                            </td>

                            <td
                              align="right"
                              style="
                                padding:8px 0;
                                color:#ffffff;
                              "
                            >
                              ${date}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding:8px 0;
                                color:#8f8b84;
                              "
                            >
                              Time
                            </td>

                            <td
                              align="right"
                              style="
                                padding:8px 0;
                                color:#ffffff;
                              "
                            >
                              ${time}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding:8px 0;
                                color:#8f8b84;
                              "
                            >
                              Screen
                            </td>

                            <td
                              align="right"
                              style="
                                padding:8px 0;
                                color:#ffffff;
                              "
                            >
                              ${screen.name} · ${screen.experience}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding:8px 0;
                                color:#8f8b84;
                              "
                            >
                              Seats
                            </td>

                            <td
                              align="right"
                              style="
                                padding:8px 0;
                                color:#ffffff;
                                font-weight:bold;
                              "
                            >
                              ${booking.seats.join(", ")}
                            </td>
                          </tr>

                        </table>

                      </td>

                    </tr>

                  </table>

                </td>

              </tr>

              <tr>

                <td
                  align="center"
                  style="
                    padding:14px 36px 26px;
                  "
                >

                  <div
                    style="
                      color:#8f8b84;
                      font-size:12px;
                      text-transform:uppercase;
                      letter-spacing:1.2px;
                    "
                  >
                    Booking Code
                  </div>

                  <div
                    style="
                      display:inline-block;
                      margin-top:10px;
                      padding:14px 22px;
                      border:1px dashed #d6a84b;
                      color:#d6a84b;
                      font-size:24px;
                      font-weight:bold;
                      letter-spacing:2px;
                      border-radius:10px;
                    "
                  >
                    ${booking.bookingCode}
                  </div>

                </td>

              </tr>

              <tr>

                <td
                  style="
                    padding:0 36px 28px;
                  "
                >

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      font-size:14px;
                    "
                  >

                    <tr>
                      <td
                        style="
                          padding:8px 0;
                          color:#a8a8a8;
                        "
                      >
                        Subtotal
                      </td>

                      <td
                        align="right"
                        style="
                          padding:8px 0;
                          color:#ffffff;
                        "
                      >
                        ${money(
                          booking.subtotal
                        )}
                      </td>
                    </tr>

                    ${discountRow}

                    <tr>
                      <td
                        style="
                          padding:14px 0 0;
                          border-top:1px solid #302b22;
                          color:#ffffff;
                          font-weight:bold;
                        "
                      >
                        Total
                      </td>

                      <td
                        align="right"
                        style="
                          padding:14px 0 0;
                          border-top:1px solid #302b22;
                          color:#d6a84b;
                          font-size:18px;
                          font-weight:bold;
                        "
                      >
                        ${money(
                          booking.totalPrice
                        )}
                      </td>
                    </tr>

                  </table>

                </td>

              </tr>

              <tr>

                <td
                  align="center"
                  style="
                    padding:22px 36px 28px;
                    border-top:1px solid #302b22;
                  "
                >

                  <p
                    style="
                      margin:0;
                      color:#8f8b84;
                      font-size:12px;
                      line-height:1.7;
                    "
                  >
                    Keep this email and your booking code for cinema entry.
                  </p>

                  <p
                    style="
                      margin:6px 0 0;
                      color:#666666;
                      font-size:12px;
                    "
                  >
                    © 2026 Nightmare Cinema · Royal Mall
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
