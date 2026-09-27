const MOVIES_API_URL = "https://nightmare-cinema-zh55.vercel.app";

async function renderBooking() {

  const seatMap = qs("#seatMap");

  if (!seatMap) return;

  const selection = JSON.parse(
    localStorage.getItem("nightmareSelection") || "null"
  );

  if (!selection || !selection.showtimeId) {

    window.location.href = "movies.html";

    return;
  }

  qs("#bookingMovie").textContent =
    selection.movieTitle;

  qs("#bookingMeta").textContent =
    `${selection.experience} · ${selection.date} · ${selection.time}`;

  qs("#bookingPoster").src =
    selection.poster;

  qs("#summaryMovie").textContent =
    selection.movieTitle;

  qs("#summaryExperience").textContent =
    selection.experience;

  qs("#summaryCinema").textContent =
    selection.cinema;

  qs("#summaryDate").textContent =
    selection.date;

  qs("#summaryTime").textContent =
    selection.time;

  qs("#summaryPrice").textContent =
    `${money(selection.price)} / seat`;

  try {

    const response = await fetch(
      `${MOVIES_API_URL}/showtimes/${selection.showtimeId}/seats`
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.message || "Could not load seats"
      );

    }

    const screen =
      data.screen ||
      data.showtime?.screen;

    const bookedSeats =
      data.bookedSeats || [];

    if (!screen) {

      throw new Error(
        "Screen information not found"
      );

    }

    const rows =
      screen.rows;

    const seatsPerRow =
      screen.seatsPerRow;

    const selected = [];

    seatMap.innerHTML = "";

    for (
      let rowIndex = 0;
      rowIndex < rows;
      rowIndex++
    ) {

      const rowName =
        String.fromCharCode(
          65 + rowIndex
        );

      const row =
        document.createElement("div");

      row.className =
        "seat-row";

      const label =
        document.createElement("span");

      label.className =
        "seat-label";

      label.textContent =
        rowName;

      row.appendChild(label);

      for (
        let seatNumber = 1;
        seatNumber <= seatsPerRow;
        seatNumber++
      ) {

        const seatName =
          `${rowName}${seatNumber}`;

        const seat =
          document.createElement("button");

        seat.type =
          "button";

        seat.className =
          "seat";

        seat.dataset.seat =
          seatName;

        seat.title =
          seatName;

        if (
          bookedSeats.includes(
            seatName
          )
        ) {

          seat.classList.add(
            "occupied"
          );

          seat.disabled =
            true;

        }

        seat.addEventListener(
          "click",
          function () {

            const name =
              this.dataset.seat;

            if (
              this.classList.contains(
                "selected"
              )
            ) {

              this.classList.remove(
                "selected"
              );

              const index =
                selected.indexOf(
                  name
                );

              if (index !== -1) {

                selected.splice(
                  index,
                  1
                );

              }

            } else {

              this.classList.add(
                "selected"
              );

              selected.push(
                name
              );

            }

            updateSeatSummary();

          }
        );

        row.appendChild(
          seat
        );

      }

      seatMap.appendChild(
        row
      );

    }

    function updateSeatSummary() {

      qs("#selectedSeats").textContent =
        selected.length
          ? selected.join(", ")
          : "None";

      qs("#ticketCount").textContent =
        selected.length +
        (
          selected.length === 1
            ? " ticket"
            : " tickets"
        );

      qs("#seatTotal").textContent =
        money(
          selected.length *
          selection.price
        );

      qs("#continueCheckout").disabled =
        selected.length === 0;

    }

    qs("#continueCheckout")
      .addEventListener(
        "click",
        function () {

          const booking = {
            ...selection,

            seats: selected,

            total:
              selected.length *
              selection.price
          };

          localStorage.setItem(
            "nightmareBooking",
            JSON.stringify(
              booking
            )
          );

          window.location.href =
            "checkout.html";

        }
      );

  } catch (error) {

    console.error(
      error
    );

    seatMap.innerHTML = `

      <div class="text-center py-4">

        <p>
          ${error.message}
        </p>

        <a
          href="movies.html"
          class="btn btn-gold"
        >
          Back to Movies
        </a>

      </div>
    `;

  }

}

function renderCheckout() {

  const form = qs("#checkoutForm");

  if (!form) return;

  const booking = JSON.parse(
    localStorage.getItem("nightmareBooking") || "null"
  );

  if (!booking) {
    window.location.href = "movies.html";
    return;
  }

  const user = JSON.parse(
    localStorage.getItem("nightmareUser") || "null"
  );

  if (user) {
    const fullName = qs("#fullName");
    const email = qs("#email");

    if (fullName) {
      fullName.value = user.name || "";
    }

    if (email) {
      email.value = user.email || "";
    }
  }

  qs("#checkoutPoster").src = booking.poster;
  qs("#checkoutMovie").textContent = booking.movieTitle;
  qs("#checkoutCinema").textContent = booking.cinema;
  qs("#checkoutSession").textContent = booking.date + " · " + booking.time;
  qs("#checkoutSeats").textContent = booking.seats.join(", ");
  qs("#checkoutExperience").textContent = booking.experience;
  qs("#checkoutSubtotal").textContent = money(booking.total);
  qs("#checkoutTotal").textContent = money(booking.total);

  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const token =
        localStorage.getItem(
          "nightmareToken"
        );

      const message =
        qs("#checkoutMessage");

      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );

      if (!token) {

        if (message) {
          message.textContent =
            "Please sign in before payment.";
        }

        setTimeout(function () {

          window.location.href =
            "auth.html";

        }, 1200);

        return;
      }

      submitButton.disabled = true;

      submitButton.textContent =
        "Preparing payment...";

      if (message) {
        message.textContent = "";
      }

      try {

        const bookingResponse =
          await fetch(
            `${MOVIES_API_URL}/bookings`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${token}`
              },

              body: JSON.stringify({
                showtime:
                  booking.showtimeId,

                seats:
                  booking.seats
              })
            }
          );

        const bookingData =
          await bookingResponse.json();

        if (!bookingResponse.ok) {

          throw new Error(
            bookingData.message ||
            "Booking failed"
          );
        }

        const savedBooking =
          bookingData.booking;


        const pendingBooking = {

          ...booking,

          bookingId:
            savedBooking._id,

          bookingCode:
            savedBooking.bookingCode,

          total:
            savedBooking.totalPrice,

          customerName:
            qs("#fullName").value.trim(),

          customerEmail:
            qs("#email").value.trim()
        };


        localStorage.setItem(
          "nightmarePendingBooking",
          JSON.stringify(
            pendingBooking
          )
        );


        const paymentResponse =
          await fetch(
            `${MOVIES_API_URL}/payments/create-session`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${token}`
              },

              body: JSON.stringify({
                bookingId:
                  savedBooking._id
              })
            }
          );


        const paymentData =
          await paymentResponse.json();


        if (!paymentResponse.ok) {

          throw new Error(
            paymentData.message ||
            "Could not start payment"
          );
        }


        if (!paymentData.sessionUrl) {

          throw new Error(
            "Payment URL was not returned"
          );
        }


        window.location.href =
          paymentData.sessionUrl;


      } catch (error) {

        console.error(error);

        if (message) {

          message.textContent =
            error.message;

        }

        submitButton.disabled = false;

        submitButton.textContent =
          "Pay with Kashier";

      }

    }
  );
}

async function renderSuccess() {

  const root =
    qs("#successTicket");

  if (!root) return;


  const token =
    localStorage.getItem(
      "nightmareToken"
    );


  const params =
    new URLSearchParams(
      window.location.search
    );


  const bookingId =
    params.get("bookingId");


  if (!token || !bookingId) {

    window.location.href =
      "index.html";

    return;
  }


  const pendingBooking =
    JSON.parse(
      localStorage.getItem(
        "nightmarePendingBooking"
      ) || "null"
    );


  try {

    const response =
      await fetch(
        `${MOVIES_API_URL}/payments/verify/${bookingId}`,
        {
          headers: {
            "Authorization":
              `Bearer ${token}`
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Could not verify payment"
      );
    }


    if (
      data.paymentStatus !==
      "PAID"
    ) {

      root.innerHTML = `
        <div class="text-center py-5">

          <h2>
            Payment not confirmed yet
          </h2>

          <p>
            Current status:
            ${data.paymentStatus || "PENDING"}
          </p>

          <a
            href="my-bookings.html"
            class="btn btn-gold"
          >
            My Bookings
          </a>

        </div>
      `;

      return;
    }


    const savedBooking =
      data.booking;


    const showtime =
      savedBooking.showtime;


    const movie =
      showtime?.movie;


    const startTime =
      showtime?.startTime
        ? new Date(
            showtime.startTime
          )
        : null;


    const date =
      startTime
        ? startTime.toLocaleDateString(
            "en-GB"
          )
        : "";


    const time =
      startTime
        ? startTime.toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit"
            }
          )
        : "";


    qs("#successMovie").textContent =
      movie?.title ||
      pendingBooking?.movieTitle ||
      "Movie";


    qs("#successSession").textContent =
      `${date} · ${time}`;


    qs("#successSeats").textContent =
      savedBooking.seats.join(", ");


    qs("#successCode").textContent =
      savedBooking.bookingCode;


    qs("#successEmail").textContent =
      savedBooking.user?.email ||
      pendingBooking?.customerEmail ||
      "";


    qs("#successTotal").textContent =
      money(
        savedBooking.totalPrice
      );


    const qrTarget =
      qs("#qrCode");


    if (
      qrTarget &&
      window.QRCode
    ) {

      new QRCode(
        qrTarget,
        {
          text:
            savedBooking.bookingCode +
            " | " +
            (movie?.title || "Movie") +
            " | " +
            savedBooking.seats.join(","),

          width: 150,
          height: 150,
          colorDark: "#111111",
          colorLight: "#ffffff"
        }
      );

    }


    localStorage.removeItem(
      "nightmareBooking"
    );

    localStorage.removeItem(
      "nightmareSelection"
    );

    localStorage.removeItem(
      "nightmarePendingBooking"
    );


  } catch (error) {

    console.error(error);

    root.innerHTML = `
      <div class="text-center py-5">

        <h2>
          Could not verify payment
        </h2>

        <p>
          ${error.message}
        </p>

        <a
          href="my-bookings.html"
          class="btn btn-gold"
        >
          My Bookings
        </a>

      </div>
    `;

  }

}

async function renderMyBookings() {

  const root = qs("#myBookings");

  if (!root) return;

  const token =
    localStorage.getItem(
      "nightmareToken"
    );

  if (!token) {

    window.location.href =
      "auth.html";

    return;
  }

  try {

    const response = await fetch(
      `${MOVIES_API_URL}/bookings/my`,
      {
        headers: {
          "Authorization":
            `Bearer ${token}`
        }
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Could not load bookings"
      );
    }

    const bookings =
      data.bookings || data;

    if (
      !Array.isArray(bookings) ||
      bookings.length === 0
    ) {

      root.innerHTML = `
        <div class="empty-card text-center">

          <span class="eyebrow">
            My Bookings
          </span>

          <h2>
            No bookings yet.
          </h2>

          <p>
            Choose a movie and book your first session.
          </p>

          <a
            href="movies.html"
            class="btn btn-gold"
          >
            Browse Movies
          </a>

        </div>
      `;

      return;
    }

    root.innerHTML =
      bookings.map(
        function (booking) {

          const showtime =
            booking.showtime;

          const movie =
            showtime?.movie;

          const screen =
            showtime?.screen;

          const startDate =
            showtime?.startTime
              ? new Date(
                  showtime.startTime
                )
              : null;

          const date =
            startDate
              ? startDate.toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  }
                )
              : "-";

          const time =
            startDate
              ? startDate.toLocaleTimeString(
                  "en-US",
                  {
                    hour: "numeric",
                    minute: "2-digit"
                  }
                )
              : "-";

          return `
            <article class="checkout-card mb-4">

              <div class="row g-4 align-items-center">

                <div class="col-md-2">

                  <img
                    src="${movie?.poster || ""}"
                    alt="${movie?.title || "Movie"}"
                    style="width:100%;max-width:120px;border-radius:10px;"
                  >

                </div>

                <div class="col-md-7">

                  <span class="eyebrow">
                    ${booking.status}
                  </span>

                  <h2 class="mb-3">
                    ${movie?.title || "Movie"}
                  </h2>

                  <p class="mb-1">
                    ${date} · ${time}
                  </p>

                  <p class="mb-1">
                    ${screen?.name || ""} · ${screen?.experience || ""}
                  </p>

                  <p class="mb-1">
                    Seats: ${booking.seats.join(", ")}
                  </p>

                  <p class="mb-0">
                    Booking code:
                    <strong>
                      ${booking.bookingCode}
                    </strong>
                  </p>

                </div>

                <div class="col-md-3 text-md-end">

                  <div class="mb-3">

                    <small class="text-secondary">
                      Total
                    </small>

                    <h3>
                      ${money(booking.totalPrice)}
                    </h3>

                  </div>

                  ${
                    booking.status === "confirmed"
                      ? `
                        <button
                          class="btn btn-outline-light-custom cancel-booking-btn"
                          data-booking-id="${booking._id}"
                        >
                          Cancel booking
                        </button>
                      `
                      : `
                        <span class="text-secondary">
                          Cancelled
                        </span>
                      `
                  }

                </div>

              </div>

            </article>
          `;
        }
      ).join("");

    qsa(".cancel-booking-btn")
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            async function () {

              const bookingId =
                this.dataset.bookingId;

              const originalText =
                this.textContent;

              this.disabled = true;

              this.textContent =
                "Cancelling...";

              try {

                const response =
                  await fetch(
                    `${MOVIES_API_URL}/bookings/${bookingId}/cancel`,
                    {
                      method: "PATCH",

                      headers: {
                        "Authorization":
                          `Bearer ${token}`
                      }
                    }
                  );

                const data =
                  await response.json();

                if (!response.ok) {

                  throw new Error(
                    data.message ||
                    "Could not cancel booking"
                  );
                }

                renderMyBookings();

              } catch (error) {

                alert(
                  error.message
                );

                this.disabled = false;

                this.textContent =
                  originalText;
              }
            }
          );
        }
      );

  } catch (error) {

    console.error(error);

    root.innerHTML = `
      <div class="text-center py-5">

        <h2>
          Could not load bookings
        </h2>

        <p>
          ${error.message}
        </p>

      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderBooking();
  renderCheckout();
  renderSuccess();
  renderMyBookings();
});
