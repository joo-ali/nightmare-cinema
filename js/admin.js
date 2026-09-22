const API_URL = "https://nightmare-cinema.vercel.app";

const token = localStorage.getItem("nightmareToken");

let movies = [];
let screens = [];
let showtimes = [];
let bookings = [];
let offers = [];

function authHeaders(includeJson = false) {
  const headers = {
    Authorization: `Bearer ${token}`
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function money(value) {
  return "EGP " + value;
}

function showSection(name) {
  document.querySelectorAll(".admin-section").forEach(function (section) {
    section.classList.remove("active");
  });

  document.querySelectorAll("[data-admin-section]").forEach(function (button) {
    button.classList.remove("active");
  });

  document.getElementById(`admin-${name}`).classList.add("active");

  const button = document.querySelector(`[data-admin-section="${name}"]`);

  if (button) {
    button.classList.add("active");
  }
}

async function verifyAdmin() {
  if (!token) {
    window.location.href = "auth.html";
    return false;
  }

  try {
    const data = await request(
      `${API_URL}/auth/me`,
      {
        headers: authHeaders()
      }
    );

    const user = data.user || data;

    if (user.role !== "admin") {
      window.location.href = "index.html";
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem("nightmareToken");
    localStorage.removeItem("nightmareUser");
    window.location.href = "auth.html";
    return false;
  }
}

async function loadMovies() {
  const data = await request(`${API_URL}/movies`);
  movies = data.movies || data;
}

async function loadScreens() {
  const data = await request(`${API_URL}/screens`);
  screens = data.screens || data;
}

async function loadShowtimes() {
  const data = await request(`${API_URL}/showtimes`);
  showtimes = data.showtimes || data;
}

async function loadOffers() {
  const data = await request(
    `${API_URL}/admin/offers`,
    {
      headers: authHeaders()
    }
  );

  offers = data.offers || data;
}

async function loadBookings() {
  const data = await request(
    `${API_URL}/admin/bookings`,
    {
      headers: authHeaders()
    }
  );

  bookings = data.bookings || data;
}

function renderStats() {
  document.getElementById("statMovies").textContent = movies.length;
  document.getElementById("statShowtimes").textContent = showtimes.length;
  document.getElementById("statScreens").textContent = screens.length;
  document.getElementById("statBookings").textContent = bookings.length;
  document.getElementById("statOffers").textContent = offers.length;
}

function renderDashboardBookings() {
  const target = document.getElementById("dashboardBookings");

  target.innerHTML = bookings
    .slice(0, 5)
    .map(function (booking) {
      return `
        <tr>
          <td>${booking.bookingCode}</td>
          <td>${booking.user?.name || "-"}</td>
          <td>${booking.showtime?.movie?.title || "-"}</td>
          <td>${booking.seats.join(", ")}</td>
          <td>${money(booking.totalPrice)}</td>
          <td>${booking.status}</td>
        </tr>
      `;
    })
    .join("");
}

function resetMovieForm() {
  const form = document.getElementById("addMovieForm");

  form.reset();

  document.getElementById("movieEditId").value = "";
  document.getElementById("movieSubmitButton").textContent = "Add Movie";
  document.getElementById("cancelMovieEdit").classList.add("d-none");
  document.getElementById("movieMessage").textContent = "";
}

function startMovieEdit(movieId) {
  const movie = movies.find(function (item) {
    return item._id === movieId;
  });

  if (!movie) {
    return;
  }

  document.getElementById("movieEditId").value = movie._id;
  document.getElementById("movieTitle").value = movie.title || "";
  document.getElementById("moviePoster").value = movie.poster || "";
  document.getElementById("movieDescription").value = movie.description || "";
  document.getElementById("movieGenre").value = Array.isArray(movie.genre)
    ? movie.genre.join(", ")
    : movie.genre || "";
  document.getElementById("movieLanguage").value = movie.language || "";
  document.getElementById("movieDuration").value = movie.duration || "";
  document.getElementById("movieAgeRating").value = movie.ageRating || "";
  document.getElementById("movieStatus").value = movie.status || "now_showing";
  document.getElementById("movieBackdrop").value = movie.backdrop || "";
  document.getElementById("movieTrailer").value = movie.trailer || "";

  if (movie.releaseDate) {
    const date = new Date(movie.releaseDate);
    document.getElementById("movieReleaseDate").value =
      date.toISOString().slice(0, 10);
  } else {
    document.getElementById("movieReleaseDate").value = "";
  }

  document.getElementById("movieSubmitButton").textContent = "Update Movie";
  document.getElementById("cancelMovieEdit").classList.remove("d-none");
  document.getElementById("movieMessage").textContent = "Editing movie";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function renderMovies() {
  const target = document.getElementById("moviesAdminRows");

  target.innerHTML = movies
    .map(function (movie) {
      return `
        <tr>
          <td><strong>${movie.title}</strong></td>
          <td>${movie.language}</td>
          <td>${movie.duration} min</td>
          <td>${movie.status}</td>
          <td class="text-end">
            <div class="d-flex gap-2 justify-content-end">
              <button
                class="btn btn-outline-light-custom btn-sm edit-movie"
                data-id="${movie._id}"
              >
                Edit
              </button>

              <button
                class="btn btn-danger btn-sm delete-movie"
                data-id="${movie._id}"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll(".edit-movie").forEach(function (button) {
    button.addEventListener("click", function () {
      startMovieEdit(this.dataset.id);
    });
  });

  document.querySelectorAll(".delete-movie").forEach(function (button) {
    button.addEventListener("click", async function () {
      const id = this.dataset.id;

      if (!confirm("Delete this movie?")) {
        return;
      }

      try {
        await request(
          `${API_URL}/movies/${id}`,
          {
            method: "DELETE",
            headers: authHeaders()
          }
        );

        if (document.getElementById("movieEditId").value === id) {
          resetMovieForm();
        }

        await refreshData();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function renderScreens() {
  const target = document.getElementById("screensAdminRows");

  target.innerHTML = screens
    .map(function (screen) {
      return `
        <tr>
          <td>${screen.name}</td>
          <td>${screen.experience}</td>
          <td>${screen.rows}</td>
          <td>${screen.seatsPerRow}</td>
          <td>${screen.rows * screen.seatsPerRow}</td>
        </tr>
      `;
    })
    .join("");
}

function renderShowtimes() {
  const target = document.getElementById("showtimesAdminRows");

  target.innerHTML = showtimes
    .map(function (showtime) {
      const date = new Date(showtime.startTime);

      return `
        <tr>
          <td>${showtime.movie?.title || "-"}</td>
          <td>${showtime.screen?.name || "-"} · ${showtime.screen?.experience || ""}</td>
          <td>${date.toLocaleDateString("en-GB")}</td>
          <td>${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</td>
          <td>${money(showtime.price)}</td>
          <td>${showtime.format}</td>
          <td class="text-end">
            <button
              class="btn btn-danger btn-sm delete-showtime"
              data-id="${showtime._id}"
            >
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll(".delete-showtime").forEach(function (button) {
    button.addEventListener("click", async function () {
      const id = this.dataset.id;

      if (!confirm("Delete this showtime?")) {
        return;
      }

      this.disabled = true;
      this.textContent = "Deleting...";

      try {
        await request(
          `${API_URL}/showtimes/${id}`,
          {
            method: "DELETE",
            headers: authHeaders()
          }
        );

        await refreshData();
      } catch (error) {
        alert(error.message);
        this.disabled = false;
        this.textContent = "Delete";
      }
    });
  });
}

let selectedOfferDates = [];
let selectedOfferMovies = [];

function renderOfferDateChips() {
  const target = document.getElementById("offerDatesList");

  target.innerHTML = selectedOfferDates
    .map(function (date) {
      return `
        <span class="cinema-chip">
          ${date}
          <button
            type="button"
            class="btn btn-sm p-0 ms-2 text-light remove-offer-date"
            data-date="${date}"
          >
            ×
          </button>
        </span>
      `;
    })
    .join("");

  document.querySelectorAll(".remove-offer-date").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedOfferDates = selectedOfferDates.filter(function (date) {
        return date !== button.dataset.date;
      });

      renderOfferDateChips();
    });
  });
}

function renderOfferMovieOptions() {
  const target =
    document.getElementById(
      "offerMoviesList"
    );

  if (!target) {
    return;
  }

  target.innerHTML =
    movies
      .map(
        function (movie) {
          const checked =
            selectedOfferMovies.includes(
              movie._id
            )
              ? "checked"
              : "";

          return `
            <div class="col-md-4 col-sm-6">
              <label class="d-flex align-items-center gap-2">
                <input
                  class="form-check-input offer-movie"
                  type="checkbox"
                  value="${movie._id}"
                  ${checked}
                >
                <span>${movie.title}</span>
              </label>
            </div>
          `;
        }
      )
      .join("");

  document
    .querySelectorAll(
      ".offer-movie"
    )
    .forEach(
      function (checkbox) {
        checkbox.addEventListener(
          "change",
          function () {
            selectedOfferMovies =
              Array.from(
                document.querySelectorAll(
                  ".offer-movie:checked"
                )
              ).map(
                function (item) {
                  return item.value;
                }
              );
          }
        );
      }
    );
}

function resetOfferForm() {
  const form = document.getElementById("offerForm");

  form.reset();

  selectedOfferDates = [];
  selectedOfferMovies = [];

  renderOfferDateChips();
  renderOfferMovieOptions();

  document.getElementById("offerEditId").value = "";
  document.getElementById("offerSubmitButton").textContent = "Add Offer";
  document.getElementById("cancelOfferEdit").classList.add("d-none");
  document.getElementById("offerActive").value = "true";
  document.getElementById("offerMessage").textContent = "";
}

function startOfferEdit(offerId) {
  const offer = offers.find(function (item) {
    return item._id === offerId;
  });

  if (!offer) {
    return;
  }

  document.getElementById("offerEditId").value = offer._id;
  document.getElementById("offerTitle").value = offer.title || "";
  document.getElementById("offerCode").value = offer.code || "";
  document.getElementById("offerDescription").value = offer.description || "";
  document.getElementById("offerImage").value = offer.image || "";
  document.getElementById("offerActive").value = String(offer.active);
  document.getElementById("offerDiscountType").value = offer.discountType || "percentage";
  document.getElementById("offerDiscountValue").value = offer.discountValue ?? 0;

  selectedOfferDates = Array.isArray(offer.validDates)
    ? [...offer.validDates]
    : [];

  selectedOfferMovies =
    Array.isArray(
      offer.applicableMovies
    )
      ? offer.applicableMovies.map(
          function (movie) {
            return String(
              movie?._id || movie
            );
          }
        )
      : [];

  renderOfferDateChips();
  renderOfferMovieOptions();

  document.getElementById("offerSubmitButton").textContent = "Update Offer";
  document.getElementById("cancelOfferEdit").classList.remove("d-none");
  document.getElementById("offerMessage").textContent = "Editing offer";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function getTodayCairo() {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Africa/Cairo"
    }
  ).formatToParts(new Date());

  const values = {};

  parts.forEach(function (part) {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function renderOffers() {
  const target = document.getElementById("offersAdminRows");
  const today = getTodayCairo();

  target.innerHTML = offers
    .map(function (offer) {
      const dates = Array.isArray(offer.validDates)
        ? offer.validDates
        : [];

      let status = "Inactive";

      if (offer.active) {
        if (dates.includes(today)) {
          status = "Available Today";
        } else if (
          dates.length > 0 &&
          dates.every(function (date) {
            return date < today;
          })
        ) {
          status = "Expired";
        } else {
          status = "Scheduled";
        }
      }

      const movieNames =
        Array.isArray(
          offer.applicableMovies
        ) &&
        offer.applicableMovies.length
          ? offer.applicableMovies
              .map(
                function (movie) {
                  return movie.title || "-";
                }
              )
              .join(", ")
          : "All Movies";

      return `
        <tr>
          <td><strong>${offer.title}</strong></td>
          <td>${offer.code || "-"}</td>
          <td>${offer.discountValue || 0}${offer.discountType === "percentage" ? "%" : " EGP"}</td>
          <td>${dates.join(", ") || "-"}</td>
          <td>${movieNames}</td>
          <td>${status}</td>
          <td class="text-end">
            <div class="d-flex gap-2 justify-content-end">
              <button
                class="btn btn-outline-light-custom btn-sm edit-offer"
                data-id="${offer._id}"
              >
                Edit
              </button>

              <button
                class="btn btn-danger btn-sm delete-offer"
                data-id="${offer._id}"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll(".edit-offer").forEach(function (button) {
    button.addEventListener("click", function () {
      startOfferEdit(this.dataset.id);
    });
  });

  document.querySelectorAll(".delete-offer").forEach(function (button) {
    button.addEventListener("click", async function () {
      const id = this.dataset.id;

      if (!confirm("Delete this offer?")) {
        return;
      }

      try {
        await request(
          `${API_URL}/offers/${id}`,
          {
            method: "DELETE",
            headers: authHeaders()
          }
        );

        if (document.getElementById("offerEditId").value === id) {
          resetOfferForm();
        }

        await refreshData();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function renderBookings() {
  const target = document.getElementById("bookingsAdminRows");

  target.innerHTML = bookings
    .map(function (booking) {
      return `
        <tr>
          <td>${booking.bookingCode}</td>
          <td>${booking.user?.name || "-"}<br><small>${booking.user?.email || ""}</small></td>
          <td>${booking.showtime?.movie?.title || "-"}</td>
          <td>${booking.showtime?.screen?.name || "-"} · ${booking.showtime?.screen?.experience || ""}</td>
          <td>${booking.seats.join(", ")}</td>
          <td>${money(booking.totalPrice)}</td>
          <td>${booking.status}</td>
        </tr>
      `;
    })
    .join("");
}

function fillSelects() {
  const movieSelect = document.getElementById("showtimeMovie");
  const screenSelect = document.getElementById("showtimeScreen");

  movieSelect.innerHTML =
    `<option value="">Choose movie</option>` +
    movies
      .map(function (movie) {
        return `<option value="${movie._id}">${movie.title}</option>`;
      })
      .join("");

  screenSelect.innerHTML =
    `<option value="">Choose screen</option>` +
    screens
      .map(function (screen) {
        return `<option value="${screen._id}">${screen.name} · ${screen.experience}</option>`;
      })
      .join("");
}

function renderAll() {
  renderStats();
  renderDashboardBookings();
  renderMovies();
  renderScreens();
  renderShowtimes();
  renderOffers();
  renderBookings();
  fillSelects();
  renderOfferMovieOptions();
}

async function refreshData() {
  await Promise.all([
    loadMovies(),
    loadScreens(),
    loadShowtimes(),
    loadBookings(),
    loadOffers()
  ]);

  renderAll();
}

document.querySelectorAll("[data-admin-section]").forEach(function (button) {
  button.addEventListener("click", function () {
    showSection(this.dataset.adminSection);
  });
});

document.getElementById("cancelMovieEdit").addEventListener("click", function () {
  resetMovieForm();
});

document.getElementById("addMovieForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = document.getElementById("movieMessage");
  const editId = document.getElementById("movieEditId").value;
  const title = document.getElementById("movieTitle").value.trim();
  const description = document.getElementById("movieDescription").value.trim();
  const poster = document.getElementById("moviePoster").value.trim();
  const language = document.getElementById("movieLanguage").value.trim();
  const duration = Number(document.getElementById("movieDuration").value);

  if (!title || !description || !poster || !language || !duration || duration < 1) {
    message.textContent = "Please complete all required movie fields correctly";
    return;
  }

  const body = {
    title,
    description,
    poster,
    backdrop: document.getElementById("movieBackdrop").value.trim(),
    trailer: document.getElementById("movieTrailer").value.trim(),
    genre: document
      .getElementById("movieGenre")
      .value
      .split(",")
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean),
    language,
    duration,
    ageRating: document.getElementById("movieAgeRating").value.trim(),
    status: document.getElementById("movieStatus").value
  };

  const releaseDate = document.getElementById("movieReleaseDate").value;

  if (releaseDate) {
    body.releaseDate = releaseDate;
  }

  const submitButton = document.getElementById("movieSubmitButton");

  submitButton.disabled = true;
  submitButton.textContent = editId ? "Updating..." : "Adding...";

  try {
    await request(
      editId
        ? `${API_URL}/movies/${editId}`
        : `${API_URL}/movies`,
      {
        method: editId ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(body)
      }
    );

    resetMovieForm();
    await refreshData();

    message.textContent = editId
      ? "Movie updated successfully"
      : "Movie added successfully";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;

    if (!document.getElementById("movieEditId").value) {
      submitButton.textContent = "Add Movie";
    }
  }
});

document.getElementById("addScreenForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = document.getElementById("screenMessage");
  const name = document.getElementById("screenName").value.trim();
  const rows = Number(document.getElementById("screenRows").value);
  const seatsPerRow = Number(document.getElementById("screenSeatsPerRow").value);

  if (!name || rows < 1 || seatsPerRow < 1) {
    message.textContent = "Enter valid screen information";
    return;
  }

  const body = {
    name,
    experience: document.getElementById("screenExperience").value,
    rows,
    seatsPerRow
  };

  try {
    await request(
      `${API_URL}/screens`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(body)
      }
    );

    this.reset();
    message.textContent = "Screen added successfully";
    await refreshData();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("addShowtimeForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = document.getElementById("showtimeMessage");
  const movie = document.getElementById("showtimeMovie").value;
  const screen = document.getElementById("showtimeScreen").value;
  const localDateTime = document.getElementById("showtimeStartTime").value;
  const price = Number(document.getElementById("showtimePrice").value);

  if (!movie || !screen || !localDateTime || price < 1) {
    message.textContent = "Please complete all showtime fields correctly";
    return;
  }

  const startTime = new Date(localDateTime);

  if (Number.isNaN(startTime.getTime())) {
    message.textContent = "Invalid showtime date";
    return;
  }

  const body = {
    movie,
    screen,
    startTime: startTime.toISOString(),
    price,
    format: document.getElementById("showtimeFormat").value
  };

  try {
    await request(
      `${API_URL}/showtimes`,
      {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(body)
      }
    );

    this.reset();
    message.textContent = "Showtime added successfully";
    await refreshData();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("addOfferDate").addEventListener("click", function () {
  const input = document.getElementById("offerDateInput");
  const date = input.value;

  if (!date) {
    return;
  }

  if (!selectedOfferDates.includes(date)) {
    selectedOfferDates.push(date);
    selectedOfferDates.sort();
  }

  input.value = "";
  renderOfferDateChips();
});

document.getElementById("cancelOfferEdit").addEventListener("click", function () {
  resetOfferForm();
});

document.getElementById("offerForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = document.getElementById("offerMessage");
  const editId = document.getElementById("offerEditId").value;
  const title = document.getElementById("offerTitle").value.trim();
  const description = document.getElementById("offerDescription").value.trim();
  const code = document.getElementById("offerCode").value.trim();
  const discountValue = Number(
    document.getElementById("offerDiscountValue").value || 0
  );
  const discountType = document.getElementById("offerDiscountType").value;

  if (!title || !description) {
    message.textContent = "Title and description are required";
    return;
  }

  if (code && discountValue <= 0) {
    message.textContent =
      "Discount value must be greater than 0 when a promo code is used";
    return;
  }

  if (discountType === "percentage" && discountValue > 100) {
    message.textContent =
      "Percentage discount cannot exceed 100";
    return;
  }

  if (selectedOfferDates.length === 0) {
    message.textContent =
      "Choose at least one valid date";
    return;
  }

  selectedOfferMovies =
    Array.from(
      document.querySelectorAll(
        ".offer-movie:checked"
      )
    ).map(
      function (item) {
        return item.value;
      }
    );

  const body = {
    title,
    description,
    code,
    image: document.getElementById("offerImage").value.trim(),
    discountType,
    discountValue,
    validDates: selectedOfferDates,
    applicableMovies: selectedOfferMovies,
    active: document.getElementById("offerActive").value === "true"
  };

  const submitButton =
    document.getElementById("offerSubmitButton");

  submitButton.disabled = true;
  submitButton.textContent =
    editId ? "Updating..." : "Adding...";

  try {
    await request(
      editId
        ? `${API_URL}/offers/${editId}`
        : `${API_URL}/offers`,
      {
        method: editId ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(body)
      }
    );

    const successText =
      editId
        ? "Offer updated successfully"
        : "Offer added successfully";

    resetOfferForm();
    await refreshData();

    message.textContent = successText;
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;

    if (!document.getElementById("offerEditId").value) {
      submitButton.textContent = "Add Offer";
    }
  }
});

async function startAdmin() {
  const allowed = await verifyAdmin();

  if (!allowed) {
    return;
  }

  try {
    await refreshData();
  } catch (error) {
    alert(error.message);
  }
}

startAdmin();
