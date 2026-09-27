import mongoose from "mongoose";

import { bookingModel } from "../../../db/models/booking.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";

import { AppError } from "../../utilities/AppError.js";
import { sendEmail } from "../../utilities/email.js";
import { bookingConfirmationEmailTemplate } from "../../utilities/bookingEmailTemplate.js";


export const createPaymentSession = async (req, res, next) => {

  try {

    const { bookingId } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return next(
        new AppError("invalid booking id", 400)
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
        new AppError("booking not found", 404)
      );
    }


    if (booking.paymentStatus === "paid") {
      return next(
        new AppError(
          "booking is already paid",
          400
        )
      );
    }


    if (booking.status === "cancelled") {
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
        message: "payment session already exists",
        bookingId: booking._id,
        sessionId: booking.kashierSessionId,
        sessionUrl: booking.kashierSessionUrl
      });

    }


    const expireAt =
      new Date(
        Date.now() + 15 * 60 * 1000
      );


    const response = await fetch(
      "https://test-api.kashier.io/v3/payment/sessions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            process.env.KASHIER_SECRET_KEY,

          "api-key":
            process.env.KASHIER_API_KEY
        },

        body: JSON.stringify({

          merchantId:
            process.env.KASHIER_MERCHANT_ID,

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

    booking.paymentExpiresAt =
      expireAt;

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


    const response =
      await fetch(
        `https://test-api.kashier.io/v3/payment/sessions/${booking.kashierSessionId}/payment`,
        {
          headers: {
            Authorization:
              process.env.KASHIER_SECRET_KEY
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

      if (
        booking.paymentStatus !==
        "paid"
      ) {

        booking.paymentStatus =
          "paid";

        booking.status =
          "confirmed";

        booking.paidAt =
          new Date();

        await booking.save();


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


        try {

          await sendEmail({
            to:
              booking.user.email,

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


      return res.json({
        message:
          "payment confirmed",

        paymentStatus:
          "PAID",

        booking
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

      if (
        booking.status !==
        "cancelled"
      ) {

        booking.paymentStatus =
          "failed";

        booking.status =
          "cancelled";

        await booking.save();


        await showtimeModel
          .findByIdAndUpdate(
            booking.showtime,
            {
              $pull: {
                bookedSeats: {
                  $in:
                    booking.seats
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


    res.json({
      message:
        "payment is still pending",

      paymentStatus
    });


  } catch (error) {

    next(error);

  }

};