import mongoose from "mongoose";
import crypto from "crypto";

import { bookingModel } from "../../../db/models/booking.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";

import { AppError } from "../../utilities/AppError.js";
import { sendEmail } from "../../utilities/email.js";
import { bookingConfirmationEmailTemplate } from "../../utilities/bookingEmailTemplate.js";


function encodeValue(value) {
  return encodeURIComponent(
    String(value ?? "")
  ).replace(
    /[!'()*]/g,
    (char) =>
      "%" +
      char
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()
  );
}


function verifyKashierSignature(
  data,
  receivedSignature
) {
  if (
    !data ||
    !Array.isArray(data.signatureKeys) ||
    !receivedSignature
  ) {
    return false;
  }

  const keys = [
    ...data.signatureKeys
  ].sort();

  const payload = keys
    .map(
      (key) =>
        `${key}=${encodeValue(data[key])}`
    )
    .join("&");

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.KASHIER_API_KEY
    )
    .update(payload)
    .digest("hex");

  if (
    !/^[a-f0-9]{64}$/i.test(
      receivedSignature
    )
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(
      expectedSignature,
      "hex"
    ),
    Buffer.from(
      receivedSignature,
      "hex"
    )
  );
}


async function populateBooking(booking) {
  await booking.populate([
    {
      path: "user",
      select: "name email"
    },
    {
      path: "showtime",
      populate: [
        {
          path: "movie",
          select: "title poster"
        },
        {
          path: "screen",
          select:
            "name experience cinema"
        }
      ]
    }
  ]);

  return booking;
}


async function sendBookingEmail(booking) {
  try {
    await sendEmail({
      to: booking.user.email,

      subject:
        `Nightmare Cinema Booking ${booking.bookingCode}`,

      html:
        bookingConfirmationEmailTemplate(
          booking
        )
    });
  } catch (emailError) {
    console.error(
      "booking confirmation email failed:",
      emailError.message
    );
  }
}


export const createPaymentSession = async (
  req,
  res,
  next
) => {
  try {
    const { bookingId } = req.body;

    if (
      !mongoose.isValidObjectId(
        bookingId
      )
    ) {
      return next(
        new AppError(
          "invalid booking id",
          400
        )
      );
    }

    const booking = await bookingModel
      .findOne({
        _id: bookingId,
        user: req.user.id
      })
      .populate(
        "user",
        "name email"
      );

    if (!booking) {
      return next(
        new AppError(
          "booking not found",
          404
        )
      );
    }

    if (
      booking.paymentStatus ===
      "paid"
    ) {
      return next(
        new AppError(
          "booking is already paid",
          400
        )
      );
    }

    if (
      booking.status ===
      "cancelled"
    ) {
      return next(
        new AppError(
          "booking is cancelled",
          400
        )
      );
    }

    if (
      booking.kashierSessionId &&
      booking.kashierSessionUrl
    ) {
      return res.json({
        message:
          "payment session already exists",

        bookingId:
          booking._id,

        sessionId:
          booking.kashierSessionId,

        sessionUrl:
          booking.kashierSessionUrl
      });
    }

    const expireAt =
      booking.paymentExpiresAt;

    if (
      !expireAt ||
      expireAt <= new Date()
    ) {
      return next(
        new AppError(
          "payment time expired",
          400
        )
      );
    }

    const response = await fetch(
      "https://test-api.kashier.io/v3/payment/sessions",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            process.env
              .KASHIER_SECRET_KEY,

          "api-key":
            process.env
              .KASHIER_API_KEY
        },

        body: JSON.stringify({
          merchantId:
            process.env
              .KASHIER_MERCHANT_ID,

          amount:
            Number(
              booking.totalPrice
            ).toFixed(2),

          currency: "EGP",

          order:
            booking.bookingCode,

          expireAt:
            expireAt.toISOString(),

          maxFailureAttempts: 3,

          type: "one-time",

          paymentType: "credit",

          allowedMethods: "card",

          defaultMethod: "card",

          display: "en",

          merchantRedirect:
            `${process.env.FRONTEND_URL}/success.html?bookingId=${booking._id}`,

          serverWebhook:
            `${process.env.BACKEND_URL}/payments/kashier-webhook`,

          customer: {
            email:
              booking.user.email,

            reference:
              String(
                booking.user._id
              )
          },

          description:
            `Nightmare Cinema ${booking.bookingCode}`,

          interactionSource:
            "ECOMMERCE",

          enable3DS: true
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Kashier error:",
        data
      );

      return next(
        new AppError(
          data.message ||
            "could not create payment session",
          502
        )
      );
    }

    booking.kashierSessionId =
      data._id;

    booking.kashierSessionUrl =
      data.sessionUrl;

    await booking.save();

    res.json({
      message:
        "payment session created",

      bookingId:
        booking._id,

      sessionId:
        data._id,

      sessionUrl:
        data.sessionUrl
    });
  } catch (error) {
    next(error);
  }
};


export const verifyPayment = async (
  req,
  res,
  next
) => {
  try {
    const { bookingId } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        bookingId
      )
    ) {
      return next(
        new AppError(
          "invalid booking id",
          400
        )
      );
    }

    const booking =
      await bookingModel.findOne({
        _id: bookingId,
        user: req.user.id
      });

    if (!booking) {
      return next(
        new AppError(
          "booking not found",
          404
        )
      );
    }

    if (
      !booking.kashierSessionId
    ) {
      return next(
        new AppError(
          "payment session not found",
          400
        )
      );
    }

    const response = await fetch(
      `https://test-api.kashier.io/v3/payment/sessions/${booking.kashierSessionId}/payment`,
      {
        headers: {
          Authorization:
            process.env
              .KASHIER_SECRET_KEY
        }
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      return next(
        new AppError(
          data.message ||
            "could not verify payment",
          502
        )
      );
    }

    const paymentStatus =
      data.data?.status;

    if (
      paymentStatus === "PAID"
    ) {
      const updatedBooking =
        await bookingModel
          .findOneAndUpdate(
            {
              _id: bookingId,

              user:
                req.user.id,

              paymentStatus:
                "pending",

              status:
                "pending_payment"
            },

            {
              $set: {
                paymentStatus:
                  "paid",

                status:
                  "confirmed",

                paidAt:
                  new Date()
              }
            },

            {
              new: true
            }
          );

      let finalBooking;

      if (updatedBooking) {
        finalBooking =
          await populateBooking(
            updatedBooking
          );

        await sendBookingEmail(
          finalBooking
        );
      } else {
        finalBooking =
          await bookingModel.findOne({
            _id: bookingId,
            user: req.user.id
          });

        if (finalBooking) {
          await populateBooking(
            finalBooking
          );
        }
      }

      return res.json({
        message:
          "payment confirmed",

        paymentStatus:
          "PAID",

        booking:
          finalBooking
      });
    }

    const failedStatuses = [
      "FAILED",
      "EXPIRED",
      "ABANDONED",
      "REJECTED",
      "VOIDED"
    ];

    if (
      failedStatuses.includes(
        paymentStatus
      )
    ) {
      const cancelledBooking =
        await bookingModel
          .findOneAndUpdate(
            {
              _id: bookingId,

              user:
                req.user.id,

              status:
                "pending_payment",

              paymentStatus:
                "pending"
            },

            {
              $set: {
                status:
                  "cancelled",

                paymentStatus:
                  "failed"
              }
            },

            {
              new: true
            }
          );

      if (cancelledBooking) {
        await showtimeModel
          .findByIdAndUpdate(
            cancelledBooking.showtime,
            {
              $pull: {
                bookedSeats: {
                  $in:
                    cancelledBooking.seats
                }
              }
            }
          );
      }

      return res.json({
        message:
          "payment failed",

        paymentStatus
      });
    }

    return res.json({
      message:
        "payment is still pending",

      paymentStatus:
        paymentStatus || "PENDING"
    });
  } catch (error) {
    next(error);
  }
};


export const kashierWebhook = async (
  req,
  res
) => {
  try {
    const {
      event,
      data
    } = req.body;

    const signature =
      req.get(
        "x-kashier-signature"
      );

    if (
      !verifyKashierSignature(
        data,
        signature
      )
    ) {
      console.error(
        "Invalid Kashier webhook signature"
      );

      return res.sendStatus(401);
    }

    if (event !== "pay") {
      return res.sendStatus(200);
    }

    if (
      data.status !== "SUCCESS"
    ) {
      console.log(
        "Kashier payment event:",
        data.status
      );

      return res.sendStatus(200);
    }

    const orderReference =
      data.merchantOrderId;

    if (!orderReference) {
      console.error(
        "Webhook merchantOrderId missing"
      );

      return res.sendStatus(200);
    }

    const booking =
      await bookingModel.findOne({
        bookingCode:
          orderReference
      });

    if (!booking) {
      console.error(
        "Webhook booking not found:",
        orderReference
      );

      return res.sendStatus(200);
    }

    if (
      data.currency &&
      String(
        data.currency
      ).toUpperCase() !== "EGP"
    ) {
      console.error(
        "Webhook currency mismatch"
      );

      return res.sendStatus(400);
    }

    if (
      data.amount !== undefined &&
      Number(data.amount) !==
        Number(
          booking.totalPrice
        )
    ) {
      console.error(
        "Payment amount mismatch"
      );

      return res.sendStatus(400);
    }

    if (
      booking.paymentStatus ===
      "paid"
    ) {
      return res.sendStatus(200);
    }

    const updatedBooking =
      await bookingModel
        .findOneAndUpdate(
          {
            _id:
              booking._id,

            paymentStatus:
              "pending",

            status:
              "pending_payment"
          },

          {
            $set: {
              paymentStatus:
                "paid",

              status:
                "confirmed",

              paidAt:
                new Date()
            }
          },

          {
            new: true
          }
        );

    if (!updatedBooking) {
      return res.sendStatus(200);
    }

    await populateBooking(
      updatedBooking
    );

    await sendBookingEmail(
      updatedBooking
    );

    console.log(
      "Kashier payment confirmed:",
      updatedBooking.bookingCode
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "Kashier webhook error:",
      error
    );

    return res.sendStatus(500);
  }
};