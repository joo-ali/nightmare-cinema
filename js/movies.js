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

document.addEventListener("DOMContentLoaded", function () {
  renderHome();
  renderMovies();
  renderMovieDetails();
});
