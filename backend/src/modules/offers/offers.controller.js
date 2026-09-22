import mongoose from "mongoose";
import { offerModel } from "../../../db/models/offer.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";
import { movieModel } from "../../../db/models/movie.model.js";
import { AppError } from "../../utilities/AppError.js";

function getCinemaDateCode(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Cairo"
  }).formatToParts(new Date(date));

  const values = {};

  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeMovieIds(movieIds) {
  if (!Array.isArray(movieIds)) {
    return [];
  }

  return [
    ...new Set(
      movieIds
        .map((id) =>
          String(id).trim()
        )
        .filter(Boolean)
    )
  ];
}

async function validateMovieIds(movieIds) {
  if (movieIds.length === 0) {
    return;
  }

  const invalidId = movieIds.find(
    (id) => !mongoose.isValidObjectId(id)
  );

  if (invalidId) {
    throw new AppError(
      "invalid applicable movie id",
      400
    );
  }

  const count = await movieModel.countDocuments({
    _id: {
      $in: movieIds
    }
  });

  if (count !== movieIds.length) {
    throw new AppError(
      "one or more applicable movies were not found",
      404
    );
  }
}

function offerAppliesToMovie(offer, movieId) {
  if (
    !Array.isArray(offer.applicableMovies) ||
    offer.applicableMovies.length === 0
  ) {
    return true;
  }

  return offer.applicableMovies.some(
    (id) => String(id?._id || id) === String(movieId)
  );
}

function normalizeDates(dates) {
  if (!Array.isArray(dates)) {
    return [];
  }

  return [
    ...new Set(
      dates
        .map((date) =>
          String(date).trim()
        )
        .filter((date) =>
          /^\d{4}-\d{2}-\d{2}$/.test(date)
        )
    )
  ].sort();
}

function getDiscount(subtotal, offer) {
  if (offer.discountType === "percentage") {
    return Math.min(
      subtotal,
      Number(
        (
          subtotal *
          (offer.discountValue / 100)
        ).toFixed(2)
      )
    );
  }

  return Math.min(subtotal, offer.discountValue);
}

async function findActiveOffer(code) {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  return offerModel.findOne({
    code: normalizedCode,
    active: true,
    discountValue: {
      $gt: 0
    }
  });
}

export const getOffers = async (req, res, next) => {
  try {
    const today = getCinemaDateCode(new Date());

    const offers = await offerModel
      .find({
        active: true,
        validDates: {
          $elemMatch: {
            $gte: today
          }
        }
      })
      .populate(
        "applicableMovies",
        "title"
      )
      .sort({
        createdAt: -1
      });

    res.json({
      message: "offers retrieved successfully",
      offers
    });
  } catch (error) {
    next(error);
  }
};

export const validateOffer = async (req, res, next) => {
  try {
    const {
      code,
      showtime,
      seatsCount
    } = req.body;

    if (!code || !showtime || !seatsCount) {
      return next(
        new AppError(
          "code, showtime and seatsCount are required",
          400
        )
      );
    }

    if (!mongoose.isValidObjectId(showtime)) {
      return next(
        new AppError("invalid showtime id", 400)
      );
    }

    const count = Number(seatsCount);

    if (!Number.isInteger(count) || count < 1) {
      return next(
        new AppError("invalid seats count", 400)
      );
    }

    const showtimeData =
      await showtimeModel.findById(showtime);

    if (!showtimeData) {
      return next(
        new AppError("showtime not found", 404)
      );
    }

    const offer = await findActiveOffer(code);

    if (!offer) {
      return next(
        new AppError(
          "invalid or inactive promo code",
          400
        )
      );
    }

    const bookingDate =
      getCinemaDateCode(new Date());

    if (!offer.validDates.includes(bookingDate)) {
      return next(
        new AppError(
          "promo code can only be used on its valid booking date",
          400
        )
      );
    }

    if (
      !offerAppliesToMovie(
        offer,
        showtimeData.movie
      )
    ) {
      return next(
        new AppError(
          "promo code is not valid for this movie",
          400
        )
      );
    }

    const subtotal =
      showtimeData.price * count;

    const discountAmount =
      getDiscount(subtotal, offer);

    const totalPrice = Number(
      (subtotal - discountAmount).toFixed(2)
    );

    res.json({
      message: "promo code applied successfully",
      code: offer.code,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      validDates: offer.validDates,
      applicableMovies:
        offer.applicableMovies,
      subtotal,
      discountAmount,
      totalPrice
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOffers = async (req, res, next) => {
  try {
    const offers = await offerModel
      .find()
      .populate(
        "applicableMovies",
        "title"
      )
      .sort({
        createdAt: -1
      });

    res.json({
      message: "all offers retrieved successfully",
      offers
    });
  } catch (error) {
    next(error);
  }
};

export const addOffer = async (req, res, next) => {
  try {
    const {
      title,
      description,
      code,
      image,
      discountType,
      discountValue,
      validDates,
      applicableMovies,
      active
    } = req.body;

    if (!title || !description) {
      return next(
        new AppError(
          "title and description are required",
          400
        )
      );
    }

    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    const parsedDiscount =
      Number(discountValue || 0);

    const type =
      discountType || "percentage";

    if (
      !["percentage", "fixed"].includes(type)
    ) {
      return next(
        new AppError(
          "invalid discount type",
          400
        )
      );
    }

    if (
      Number.isNaN(parsedDiscount) ||
      parsedDiscount < 0
    ) {
      return next(
        new AppError(
          "invalid discount value",
          400
        )
      );
    }

    if (
      type === "percentage" &&
      parsedDiscount > 100
    ) {
      return next(
        new AppError(
          "percentage discount cannot exceed 100",
          400
        )
      );
    }

    if (
      normalizedCode &&
      parsedDiscount <= 0
    ) {
      return next(
        new AppError(
          "discount value must be greater than 0 when a promo code is used",
          400
        )
      );
    }

    const normalizedDates =
      normalizeDates(validDates);

    const normalizedMovies =
      normalizeMovieIds(applicableMovies);

    await validateMovieIds(normalizedMovies);

    if (normalizedDates.length === 0) {
      return next(
        new AppError(
          "choose at least one valid date",
          400
        )
      );
    }

    if (normalizedCode) {
      const existing =
        await offerModel.findOne({
          code: normalizedCode
        });

      if (existing) {
        return next(
          new AppError(
            "promo code already exists",
            409
          )
        );
      }
    }

    const offer = await offerModel.create({
      title,
      description,
      code: normalizedCode,
      image: image || "",
      discountType: type,
      discountValue: parsedDiscount,
      validDates: normalizedDates,
      applicableMovies: normalizedMovies,
      active:
        active === undefined
          ? true
          : Boolean(active)
    });

    res.status(201).json({
      message: "offer added successfully",
      offer
    });
  } catch (error) {
    next(error);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(
        new AppError("invalid offer id", 400)
      );
    }

    const offer =
      await offerModel.findById(id);

    if (!offer) {
      return next(
        new AppError("offer not found", 404)
      );
    }

    const normalizedCode =
      Object.prototype.hasOwnProperty.call(
        req.body,
        "code"
      )
        ? String(req.body.code || "")
            .trim()
            .toUpperCase()
        : offer.code;

    const discountType =
      Object.prototype.hasOwnProperty.call(
        req.body,
        "discountType"
      )
        ? req.body.discountType
        : offer.discountType;

    const discountValue =
      Object.prototype.hasOwnProperty.call(
        req.body,
        "discountValue"
      )
        ? Number(req.body.discountValue)
        : offer.discountValue;

    if (
      !["percentage", "fixed"].includes(
        discountType
      )
    ) {
      return next(
        new AppError(
          "invalid discount type",
          400
        )
      );
    }

    if (
      Number.isNaN(discountValue) ||
      discountValue < 0
    ) {
      return next(
        new AppError(
          "invalid discount value",
          400
        )
      );
    }

    if (
      discountType === "percentage" &&
      discountValue > 100
    ) {
      return next(
        new AppError(
          "percentage discount cannot exceed 100",
          400
        )
      );
    }

    if (
      normalizedCode &&
      discountValue <= 0
    ) {
      return next(
        new AppError(
          "discount value must be greater than 0 when a promo code is used",
          400
        )
      );
    }

    if (normalizedCode) {
      const existing =
        await offerModel.findOne({
          code: normalizedCode,
          _id: {
            $ne: id
          }
        });

      if (existing) {
        return next(
          new AppError(
            "promo code already exists",
            409
          )
        );
      }
    }

    let normalizedMovies =
      Array.isArray(offer.applicableMovies)
        ? offer.applicableMovies.map(
            (movie) =>
              String(movie?._id || movie)
          )
        : [];

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "applicableMovies"
      )
    ) {
      normalizedMovies =
        normalizeMovieIds(
          req.body.applicableMovies
        );

      await validateMovieIds(
        normalizedMovies
      );
    }

    let normalizedDates =
      offer.validDates;

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "validDates"
      )
    ) {
      normalizedDates =
        normalizeDates(
          req.body.validDates
        );

      if (normalizedDates.length === 0) {
        return next(
          new AppError(
            "choose at least one valid date",
            400
          )
        );
      }
    }

    offer.title =
      req.body.title ?? offer.title;

    offer.description =
      req.body.description ??
      offer.description;

    offer.code = normalizedCode;

    offer.image =
      req.body.image ?? offer.image;

    offer.discountType =
      discountType;

    offer.discountValue =
      discountValue;

    offer.validDates =
      normalizedDates;

    offer.applicableMovies =
      normalizedMovies;

    offer.active =
      req.body.active ?? offer.active;

    await offer.save();

    res.json({
      message: "offer updated successfully",
      offer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(
        new AppError("invalid offer id", 400)
      );
    }

    const offer =
      await offerModel.findByIdAndDelete(id);

    if (!offer) {
      return next(
        new AppError("offer not found", 404)
      );
    }

    res.json({
      message: "offer deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
