function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return document.querySelectorAll(selector);
}

const MOVIES_API_URL = "https://nightmare-cinema.vercel.app";

async function fetchMovies() {

  const response = await fetch(
    `${MOVIES_API_URL}/movies`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load movies"
    );
  }

  return data.movies;
}

function getGenre(movie) {

  if (Array.isArray(movie.genre)) {
    return movie.genre.join(", ");
  }

  return movie.genre || "Movie";
}

function getMovie(id) {
  return MOVIES.find(function (movie) {
    return movie.id === id;
  }) || MOVIES[0];
}

function money(value) {
  return "EGP " + value;
}

function movieCard(movie) {

  const genre = getGenre(movie);

  return `
    <article
      class="movie-card"
      data-name="${movie.title.toLowerCase()}"
      data-genre="${genre.toLowerCase()}"
    >

      <a
        class="movie-poster"
        href="movie.html?id=${movie._id}"
      >

        <img
          src="${movie.poster}"
          alt="${movie.title}"
          loading="lazy"
        >

        <span class="movie-age">
          ${movie.ageRating || "G"}
        </span>

        <span class="movie-hover">
          View movie
        </span>

      </a>

      <div class="movie-card-body">

        <h3>${movie.title}</h3>

        <p>
          ${genre} · ${movie.duration} min
        </p>

        <div class="movie-card-actions">

          <a
            href="movie.html?id=${movie._id}"
            class="text-link"
          >
            Details
          </a>

          <a
            href="movie.html?id=${movie._id}#showtimes"
            class="btn btn-gold btn-sm"
          >
            Book
          </a>

        </div>

      </div>

    </article>
  `;
}

async function renderHome() {

  const featured = qs("#featuredMovie");
  const homeMovies = qs("#homeMovies");

  if (!featured || !homeMovies) return;

  try {

    const movies = await fetchMovies();

    const nowShowing = movies.filter(
      movie => movie.status === "now_showing"
    );

    if (nowShowing.length === 0) {

      featured.innerHTML = `
        <p>No movies available right now.</p>
      `;

      return;
    }

    const movie = nowShowing[0];

    const genre = getGenre(movie);

    featured.innerHTML = `

      <div class="hero-content">

        <span class="eyebrow">
          Now showing · Royal Mall
        </span>

        <h1>
          ${movie.title}
        </h1>

        <div class="hero-meta">

          <span>
            ${movie.ageRating || "G"}
          </span>

          <span>
            ${genre}
          </span>

          <span>
            ${movie.duration} min
          </span>

          <span>
            ${movie.language}
          </span>

        </div>

        <p>
          ${movie.description}
        </p>

        <div class="d-flex flex-wrap gap-2">

          <a
            href="movie.html?id=${movie._id}#showtimes"
            class="btn btn-gold"
          >
            Book tickets
          </a>

          <a
            href="movie.html?id=${movie._id}"
            class="btn btn-outline-light-custom"
          >
            Movie details
          </a>

        </div>

      </div>

      <div class="hero-poster-wrap">

        <div class="hero-number">
          01
        </div>

        <img
          src="${movie.poster}"
          alt="${movie.title}"
          class="hero-poster"
        >

      </div>
    `;

    homeMovies.innerHTML =
      nowShowing
        .slice(0, 6)
        .map(movieCard)
        .join("");

  } catch (error) {

    console.error(error);

    featured.innerHTML = `
      <p>Cannot load movies from server.</p>
    `;

  }
}

async function renderMovies() {

  const grid = qs("#moviesGrid");

  if (!grid) return;

  try {

    const movies = await fetchMovies();

    function draw(list) {

      grid.innerHTML =
        list.map(movieCard).join("");

      const empty = qs("#movieEmpty");

      if (empty) {

        empty.classList.toggle(
          "d-none",
          list.length !== 0
        );

      }
    }

    draw(movies);

    const search =
      qs("#movieSearch");

    const genre =
      qs("#genreFilter");

    function filterMovies() {

      const text = search
        ? search.value
            .trim()
            .toLowerCase()
        : "";

      const selectedGenre = genre
        ? genre.value
            .trim()
            .toLowerCase()
        : "";

      const filtered =
        movies.filter(function (movie) {

          const nameOk =
            movie.title
              .toLowerCase()
              .includes(text);

          const genres =
            Array.isArray(movie.genre)
              ? movie.genre.map(
                  item =>
                    item.toLowerCase()
                )
              : [
                  String(
                    movie.genre || ""
                  ).toLowerCase()
                ];

          const genreOk =
            !selectedGenre ||
            genres.includes(
              selectedGenre
            );

          return nameOk && genreOk;

        });

      draw(filtered);

    }

    if (search) {

      search.addEventListener(
        "input",
        filterMovies
      );

    }

    if (genre) {

      genre.addEventListener(
        "change",
        filterMovies
      );

    }

  } catch (error) {

    console.error(error);

    grid.innerHTML = `
      <p>
        Cannot load movies from server.
      </p>
    `;

  }
}

async function renderMovieDetails() {

  const root = qs("#movieDetails");

  if (!root) return;

  const params = new URLSearchParams(
    window.location.search
  );

  const movieId = params.get("id");

  if (!movieId) {

    root.innerHTML = `
      <p>Movie not found.</p>
    `;

    return;
  }

  try {

    const movieResponse = await fetch(
      `${MOVIES_API_URL}/movies/${movieId}`
    );

    const movieData =
      await movieResponse.json();

    if (!movieResponse.ok) {

      throw new Error(
        movieData.message ||
        "Movie not found"
      );
    }

    const movie =
      movieData.movie || movieData;

    const showtimeResponse =
      await fetch(
        `${MOVIES_API_URL}/showtimes?movie=${movieId}`
      );

    const showtimeData =
      await showtimeResponse.json();

    if (!showtimeResponse.ok) {

      throw new Error(
        showtimeData.message ||
        "Could not load showtimes"
      );
    }

    const showtimes = (
      showtimeData.showtimes ||
      showtimeData
    ).filter(function (showtime) {
      return (
        showtime.status !== "cancelled" &&
        new Date(showtime.startTime) > new Date()
      );
    });

    const genre =
      Array.isArray(movie.genre)
        ? movie.genre.join(", ")
        : movie.genre;

    document.title =
      `${movie.title} — Nightmare Cinema`;

    const releaseDate =
      movie.releaseDate
        ? new Date(
            movie.releaseDate
          ).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          )
        : "Coming soon";

    root.innerHTML = `

      <div class="detail-poster-col">

        <div class="detail-poster-card">

          <img
            src="${movie.poster}"
            alt="${movie.title}"
          >

          <span class="detail-age">
            ${movie.ageRating || "G"}
          </span>

        </div>

      </div>

      <div class="detail-content-col">

        <span class="eyebrow">
          ${
            movie.status === "now_showing"
              ? "Now showing"
              : "Coming soon"
          }
          · ${genre}
        </span>

        <h1 class="detail-title">
          ${movie.title}
        </h1>

        <div class="detail-meta-row">

          <span>
            ${movie.duration} min
          </span>

          <span>
            ${movie.language}
          </span>

          <span>
            ${movie.ageRating || "G"}
          </span>

          <span>
            ${releaseDate}
          </span>

        </div>

        <p class="detail-description">
          ${movie.description}
        </p>

        <div class="detail-facts">

          <div>

            <small>Cinema</small>

            <strong>
              Royal Mall
            </strong>

          </div>

          <div>

            <small>Status</small>

            <strong>
              ${
                movie.status === "now_showing"
                  ? "Now Showing"
                  : "Coming Soon"
              }
            </strong>

          </div>

          <div>

            <small>Rating</small>

            <strong>
              ${
                movie.rating
                  ? movie.rating + " / 10"
                  : "Not rated"
              }
            </strong>

          </div>

        </div>

        <section
          class="showtime-section"
          id="showtimes"
        >

          <div
            class="section-title-row compact"
          >

            <div>

              <span class="eyebrow">
                Choose your session
              </span>

              <h2>
                Showtimes
              </h2>

            </div>

            <span class="cinema-chip">
              Royal Mall
            </span>

          </div>

          <div
            class="date-list"
            id="dateList"
          ></div>

          <div id="showtimeGroups">

            <p>
              Loading showtimes...
            </p>

          </div>

        </section>

      </div>
    `;

    const dateList = qs("#dateList");
    const groups = qs("#showtimeGroups");

    if (
      !Array.isArray(showtimes) ||
      showtimes.length === 0
    ) {

      dateList.innerHTML = "";

      groups.innerHTML = `
        <p>
          No showtimes available.
        </p>
      `;

      return;
    }

    showtimes.sort(
      (a, b) =>
        new Date(a.startTime) -
        new Date(b.startTime)
    );

    const showtimesByDate = {};

    showtimes.forEach(
      function (showtime) {

        const date =
          new Date(
            showtime.startTime
          );

        const year =
          date.getFullYear();

        const month =
          String(
            date.getMonth() + 1
          ).padStart(2, "0");

        const day =
          String(
            date.getDate()
          ).padStart(2, "0");

        const dateKey =
          `${year}-${month}-${day}`;

        if (!showtimesByDate[dateKey]) {

          showtimesByDate[dateKey] = [];
        }

        showtimesByDate[
          dateKey
        ].push(showtime);
      }
    );

    const availableDates =
      Object.keys(
        showtimesByDate
      );

    function renderShowtimesForDate(
      dateKey
    ) {

      groups.innerHTML = "";

      const selectedShowtimes =
        showtimesByDate[
          dateKey
        ];

      const groupedByExperience =
        {};

      selectedShowtimes.forEach(
        function (showtime) {

          const experience =
            showtime.screen.experience;

          if (
            !groupedByExperience[
              experience
            ]
          ) {

            groupedByExperience[
              experience
            ] = [];
          }

          groupedByExperience[
            experience
          ].push(showtime);
        }
      );

      Object.keys(
        groupedByExperience
      ).forEach(
        function (experience) {

          const showtimeList =
            groupedByExperience[
              experience
            ];

          const firstShowtime =
            showtimeList[0];

          const row =
            document.createElement(
              "div"
            );

          row.className =
            "experience-row";

          row.innerHTML = `

            <div class="experience-head">

              <div>

                <strong>
                  ${experience}
                </strong>

                <small>
                  ${firstShowtime.screen.name}
                </small>

              </div>

              <span>
                ${money(
                  firstShowtime.price
                )}
              </span>

            </div>

            <div class="time-list"></div>
          `;

          const list =
            row.querySelector(
              ".time-list"
            );

          showtimeList.forEach(
            function (showtime) {

              const startDate =
                new Date(
                  showtime.startTime
                );

              const time =
                startDate
                  .toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      minute: "2-digit"
                    }
                  );

              const fullDate =
                startDate
                  .toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }
                  );

              const button =
                document.createElement(
                  "button"
                );

              button.className =
                "time-btn";

              button.textContent =
                time;

              button.addEventListener(
                "click",
                function () {

                  localStorage.setItem(
                    "nightmareSelection",

                    JSON.stringify({

                      showtimeId:
                        showtime._id,

                      movieId:
                        movie._id,

                      movieTitle:
                        movie.title,

                      poster:
                        movie.poster,

                      cinema:
                        showtime.cinema ||
                        "Royal Mall",

                      screenId:
                        showtime.screen._id,

                      screenName:
                        showtime.screen.name,

                      experience:
                        showtime.screen.experience,

                      date:
                        fullDate,

                      time:
                        time,

                      price:
                        showtime.price
                    })
                  );

                  window.location.href =
                    "booking.html";
                }
              );

              list.appendChild(
                button
              );
            }
          );

          groups.appendChild(
            row
          );
        }
      );
    }

    dateList.innerHTML = "";

    availableDates.forEach(
      function (dateKey, index) {

        const date =
          new Date(
            `${dateKey}T12:00:00`
          );

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "date-box";

        if (index === 0) {

          button.classList.add(
            "active"
          );
        }

        button.innerHTML = `

          <span>
            ${
              date
                .toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short"
                  }
                )
                .toUpperCase()
            }
          </span>

          <strong>
            ${date.getDate()}
          </strong>

          <small>
            ${
              date
                .toLocaleDateString(
                  "en-US",
                  {
                    month: "short"
                  }
                )
                .toUpperCase()
            }
          </small>
        `;

        button.addEventListener(
          "click",
          function () {

            qsa(".date-box")
              .forEach(
                function (item) {

                  item.classList.remove(
                    "active"
                  );
                }
              );

            button.classList.add(
              "active"
            );

            renderShowtimesForDate(
              dateKey
            );
          }
        );

        dateList.appendChild(
          button
        );
      }
    );

    renderShowtimesForDate(
      availableDates[0]
    );

  } catch (error) {

    console.error(error);

    root.innerHTML = `

      <div class="text-center py-5">

        <h2>
          Could not load movie
        </h2>

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

async function renderOffers() {

  const target = qs("#offersContent");

  if (!target) return;

  try {

    const response = await fetch(
      `${MOVIES_API_URL}/offers`
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Could not load offers"
      );
    }

    const offers =
      data.offers || data;

    if (
      !Array.isArray(offers) ||
      offers.length === 0
    ) {

      target.innerHTML = `
        <div class="offers-empty">

          <span class="eyebrow">
            Current offers
          </span>

          <h2>
            No cinema offers right now.
          </h2>

          <p>
            Check back later for new Nightmare Cinema promotions.
          </p>

          <a
            class="btn btn-gold"
            href="movies.html"
          >
            Browse movies
          </a>

        </div>
      `;

      return;
    }

    const today =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone:
            "Africa/Cairo"
        }
      ).format(
        new Date()
      );

    target.innerHTML = `
      <div class="row g-4">

        ${offers.map(function (offer) {

          const dates =
            Array.isArray(
              offer.validDates
            )
              ? offer.validDates
              : [];

          const availableToday =
            dates.includes(today);

          const datesText =
            dates
              .map(
                function (date) {
                  return new Date(
                    date +
                    "T12:00:00"
                  ).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }
                  );
                }
              )
              .join(", ");

          const movieNames =
            Array.isArray(
              offer.applicableMovies
            ) &&
            offer.applicableMovies.length
              ? offer.applicableMovies
                  .map(
                    function (movie) {
                      return movie.title;
                    }
                  )
                  .join(", ")
              : "All Movies";

          return `
            <div class="col-md-6">

              <article class="checkout-card h-100">

                ${
                  offer.image
                    ? `
                      <img
                        src="${offer.image}"
                        alt="${offer.title}"
                        style="width:100%;height:220px;object-fit:cover;border-radius:12px;margin-bottom:20px;"
                      >
                    `
                    : ""
                }

                <div class="d-flex justify-content-between align-items-center gap-3">

                  <span class="eyebrow">
                    Offer
                  </span>

                  <span class="cinema-chip">
                    ${
                      availableToday
                        ? "Available Today"
                        : "Upcoming Dates"
                    }
                  </span>

                </div>

                <h2 class="mt-3">
                  ${offer.title}
                </h2>

                <p class="text-secondary">
                  ${offer.description}
                </p>

                ${
                  offer.code
                    ? `
                      <div class="mb-3">
                        <small class="text-secondary">
                          Promo code
                        </small>

                        <div>
                          <strong>
                            ${offer.code}
                          </strong>
                        </div>
                      </div>
                    `
                    : ""
                }

                <p class="text-secondary mb-2">
                  Promo booking dates: ${datesText}
                </p>

                <p class="text-secondary mb-2">
                  Valid for: ${movieNames}
                </p>

                <div class="d-flex justify-content-between align-items-center gap-3 mt-4">

                  <span class="text-secondary">
                    Royal Mall
                  </span>

                  <a
                    href="movies.html"
                    class="btn btn-gold btn-sm"
                  >
                    Browse Movies
                  </a>

                </div>

              </article>

            </div>
          `;
        }).join("")}

      </div>
    `;

  } catch (error) {

    console.error(error);

    target.innerHTML = `
      <div class="offers-empty">

        <h2>
          Could not load offers.
        </h2>

        <p>
          ${error.message}
        </p>

      </div>
    `;
  }
}
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

  let appliedPromoCode = "";
  let previewDiscount = 0;
  let previewTotal = booking.total;

  qs("#checkoutPoster").src =
    booking.poster;

  qs("#checkoutMovie").textContent =
    booking.movieTitle;

  qs("#checkoutCinema").textContent =
    booking.cinema;

  qs("#checkoutSession").textContent =
    booking.date + " · " + booking.time;

  qs("#checkoutSeats").textContent =
    booking.seats.join(", ");

  qs("#checkoutExperience").textContent =
    booking.experience;

  qs("#checkoutSubtotal").textContent =
    money(booking.total);

  qs("#checkoutDiscount").textContent =
    money(0);

  qs("#checkoutTotal").textContent =
    money(booking.total);

  const promoInput =
    qs("#promoCode");

  const promoButton =
    qs("#applyPromo");

  const promoMessage =
    qs("#promoMessage");

  promoButton.addEventListener(
    "click",
    async function () {

      const code =
        promoInput.value
          .trim()
          .toUpperCase();

      if (!code) {
        appliedPromoCode = "";
        previewDiscount = 0;
        previewTotal = booking.total;
        qs("#checkoutDiscount").textContent =
          money(0);
        qs("#checkoutTotal").textContent =
          money(booking.total);
        promoMessage.textContent =
          "Enter a promo code.";
        return;
      }

      promoButton.disabled = true;
      promoButton.textContent =
        "Applying...";
      promoMessage.textContent = "";

      try {
        const response = await fetch(
          `${MOVIES_API_URL}/offers/validate`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              code,
              showtime:
                booking.showtimeId,
              seatsCount:
                booking.seats.length
            })
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Invalid promo code"
          );
        }

        appliedPromoCode =
          data.code;

        previewDiscount =
          data.discountAmount;

        previewTotal =
          data.totalPrice;

        promoInput.value =
          appliedPromoCode;

        qs("#checkoutDiscount").textContent =
          "- " + money(
            previewDiscount
          );

        qs("#checkoutTotal").textContent =
          money(
            previewTotal
          );

        promoMessage.textContent =
          "Promo code applied successfully";
      } catch (error) {
        appliedPromoCode = "";
        previewDiscount = 0;
        previewTotal = booking.total;

        qs("#checkoutDiscount").textContent =
          money(0);

        qs("#checkoutTotal").textContent =
          money(
            booking.total
          );

        promoMessage.textContent =
          error.message;
      } finally {
        promoButton.disabled = false;
        promoButton.textContent =
          "Apply";
      }
    }
  );

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
            "Please sign in before confirming your booking.";
        }

        setTimeout(
          function () {
            window.location.href =
              "auth.html";
          },
          1200
        );

        return;
      }

      const customerName =
        qs("#fullName").value.trim();

      const customerEmail =
        qs("#email").value.trim();

      submitButton.disabled = true;
      submitButton.textContent =
        "Confirming booking...";

      if (message) {
        message.textContent = "";
      }

      try {
        const response = await fetch(
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
                booking.seats,
              promoCode:
                appliedPromoCode || undefined
            })
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Booking failed"
          );
        }

        const savedBooking =
          data.booking || data;

        const confirmedBooking = {
          ...booking,
          bookingId:
            savedBooking._id,
          bookingCode:
            savedBooking.bookingCode,
          subtotal:
            savedBooking.subtotal ??
            booking.total,
          discountAmount:
            savedBooking.discountAmount ??
            0,
          promoCode:
            savedBooking.promoCode ??
            appliedPromoCode,
          total:
            savedBooking.totalPrice ??
            previewTotal,
          ticketPrice:
            savedBooking.ticketPrice ??
            booking.price,
          customerName,
          customerEmail
        };

        localStorage.setItem(
          "nightmareConfirmedBooking",
          JSON.stringify(
            confirmedBooking
          )
        );

        localStorage.removeItem(
          "nightmareBooking"
        );

        localStorage.removeItem(
          "nightmareSelection"
        );

        window.location.href =
          "success.html";
      } catch (error) {
        console.error(error);

        if (message) {
          message.textContent =
            error.message +
            (
              error.message
                .toLowerCase()
                .includes("already booked")
                ? " Go back and choose different seats."
                : ""
            );
        }

        submitButton.disabled = false;
        submitButton.textContent =
          "Confirm booking";
      }
    }
  );
}
function renderSuccess() {
  var root = qs("#successTicket");
  if (!root) return;
  var booking = JSON.parse(localStorage.getItem("nightmareConfirmedBooking") || "null");
  if (!booking) {
    window.location.href = "index.html";
    return;
  }

  qs("#successMovie").textContent = booking.movieTitle;
  qs("#successSession").textContent = booking.date + " · " + booking.time;
  qs("#successSeats").textContent = booking.seats.join(", ");
  qs("#successCode").textContent = booking.bookingCode;
  qs("#successEmail").textContent = booking.customerEmail;
  qs("#successTotal").textContent = money(booking.total);

  var qrTarget = qs("#qrCode");
  if (qrTarget && window.QRCode) {
    new QRCode(qrTarget, {
      text: booking.bookingCode + " | " + booking.movieTitle + " | " + booking.seats.join(","),
      width: 150,
      height: 150,
      colorDark: "#111111",
      colorLight: "#ffffff"
    });
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
        <div class="offers-empty text-center">

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

function updateNavbarAuth() {

  const user = JSON.parse(
    localStorage.getItem("nightmareUser") || "null"
  );

  const token = localStorage.getItem("nightmareToken");

  const signInButton = document.querySelector(
    'a[href="auth.html"].btn'
  );

  if (!signInButton) return;

  if (user && token) {

    signInButton.outerHTML = `
      <div class="dropdown">

        <button
          class="btn btn-gold btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          ${user.name}
        </button>

        <ul class="dropdown-menu dropdown-menu-end">

          <li>
            <a
              class="dropdown-item"
              href="my-bookings.html"
            >
              My Bookings
            </a>
          </li>

          ${
            user.role === "admin"
              ? `
                <li>
                  <a
                    class="dropdown-item"
                    href="admin.html"
                  >
                    Admin Dashboard
                  </a>
                </li>
              `
              : ""
          }

          <li>
            <a
              class="dropdown-item"
              href="#"
              id="logoutButton"
            >
              Logout
            </a>
          </li>

        </ul>

      </div>
    `;

    const logoutButton =
      document.getElementById("logoutButton");

    logoutButton.addEventListener("click", function (event) {

      event.preventDefault();

      localStorage.removeItem("nightmareToken");
      localStorage.removeItem("nightmareUser");

      window.location.href = "index.html";

    });

  }
}

document.addEventListener("DOMContentLoaded", function () {

  updateNavbarAuth();

  renderHome();
  renderMovies();
  renderMovieDetails();
  renderOffers();
  renderBooking();
  renderCheckout();
  renderSuccess();
  renderMyBookings();
  initAuthTabs();

});
