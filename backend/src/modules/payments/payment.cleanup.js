import { bookingModel } from "../../../db/models/booking.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";

import { sendEmail } from "../../utilities/email.js";
import { bookingConfirmationEmailTemplate } from "../../utilities/bookingEmailTemplate.js";


const KASHIER_API_URL =
  "https://test-api.kashier.io";


async function getKashierSessionStatus(
  sessionId
) {
  try {
    const response = await fetch(
      `${KASHIER_API_URL}/v3/payment/sessions/${sessionId}`
    );

    if (!response.ok) {
      console.error(
        "Could not check Kashier session:",
        sessionId
      );

      return null;
    }

    const data =
      await response.json();

    return data.status || null;

  } catch (error) {
    console.error(
      "Kashier session check failed:",
      error.message
    );

    return null;
  }
}


async function confirmPaidBooking(
  booking
) {
  const updatedBooking =
    await bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: "pending_payment",
          paymentStatus: "pending"
        },
        {
          $set: {
            status: "confirmed",
            paymentStatus: "paid",
            paidAt: new Date()
          }
        },
        {
          new: true
        }
      );

  if (!updatedBooking) {
    return;
  }


  await updatedBooking.populate([
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
        updatedBooking.user.email,

      subject:
        `Nightmare Cinema Booking ${updatedBooking.bookingCode}`,

      html:
        bookingConfirmationEmailTemplate(
          updatedBooking
        )
    });
  } catch (emailError) {
    console.error(
      "cleanup confirmation email failed:",
      emailError.message
    );
  }


  console.log(
    "Expired check found paid booking:",
    updatedBooking.bookingCode
  );
}


async function cancelExpiredBooking(
  booking
) {
  const cancelledBooking =
    await bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: "pending_payment",
          paymentStatus: "pending"
        },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "failed"
          }
        },
        {
          new: true
        }
      );


  if (!cancelledBooking) {
    return;
  }


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


  console.log(
    "Expired booking released:",
    cancelledBooking.bookingCode
  );
}


export async function cleanupExpiredPayments(
  showtimeId = null
) {
  const gracePeriod =
    2 * 60 * 1000;


  const filter = {
    status:
      "pending_payment",

    paymentStatus:
      "pending",

    paymentExpiresAt: {
      $lte:
        new Date(
          Date.now() -
          gracePeriod
        )
    }
  };


  if (showtimeId) {
    filter.showtime =
      showtimeId;
  }


  const bookings =
    await bookingModel.find(
      filter
    );


  for (
    const booking
    of bookings
  ) {
    if (
      !booking.kashierSessionId
    ) {
      await cancelExpiredBooking(
        booking
      );

      continue;
    }


    const sessionStatus =
      await getKashierSessionStatus(
        booking.kashierSessionId
      );


    if (!sessionStatus) {
      continue;
    }


    if (
      sessionStatus === "PAID"
    ) {
      await confirmPaidBooking(
        booking
      );

      continue;
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
        sessionStatus
      )
    ) {
      await cancelExpiredBooking(
        booking
      );

      continue;
    }


    console.log(
      "Payment still not final:",
      booking.bookingCode,
      sessionStatus
    );
  }
}