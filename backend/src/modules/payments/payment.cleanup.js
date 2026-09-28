import {
  bookingModel
} from "../../../db/models/booking.model.js";

import {
  showtimeModel
} from "../../../db/models/showtime.model.js";


async function getSessionStatus(
  sessionId
) {

  if (!sessionId) {
    return null;
  }

  try {

    const response =
      await fetch(
        `https://test-api.kashier.io/v3/payment/sessions/${sessionId}/payment`,
        {
          headers: {
            Authorization:
              process.env.KASHIER_SECRET_KEY
          }
        }
      );


    if (!response.ok) {
      return null;
    }


    const data =
      await response.json();


    return (
      data.data?.status ||
      null
    );

  } catch (error) {

    console.error(
      "Kashier cleanup check failed:",
      error.message
    );

    return null;
  }

}


export async function cleanupExpiredPayments(
  showtimeId = null
) {

  const filter = {

    status:
      "pending_payment",

    paymentStatus:
      "pending",

    paymentExpiresAt: {
      $lte: new Date()
    }

  };


  if (showtimeId) {
    filter.showtime =
      showtimeId;
  }


  const expiredBookings =
    await bookingModel.find(
      filter
    );


  for (
    const booking
    of expiredBookings
  ) {

    const kashierStatus =
      await getSessionStatus(
        booking.kashierSessionId
      );


    if (
      kashierStatus === "PAID"
    ) {

      continue;
    }


    const cancelledBooking =
      await bookingModel
        .findOneAndUpdate(
          {
            _id: booking._id,

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


    if (!cancelledBooking) {
      continue;
    }


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


    console.log(
      "Expired booking released:",
      booking.bookingCode
    );

  }

}