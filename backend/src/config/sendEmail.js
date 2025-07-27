// Preferring Zeptomail for transactional emails
// This file is responsible for sending emails using Zeptomail's API

import { SendMailClient } from "zeptomail";

const url = "api.zeptomail.com/";
const token = process.env.ZEPTOMAIL_API_KEY;

const client = new SendMailClient({
  url,
  token: token,
});

const allowedEmails = ["ujjwalint22@gmail.com", "srenuka288@gmail.com", "milanbhattarai0007@gmail.com"];

export function sendMail(mailOptions) {
  if (
    process.env.status === "development" &&
    !allowedEmails.includes(mailOptions.to)
  ) {
    console.log("Email is not sent as it is not sent to an allowed email");
    return;
  }

  client
    .sendMail({
      from: {
        address: process.env.EMAIL_FROM,
        name: process.env.COMPANY_NAME,
      },
      to: [
        {
          email_address: {
            address: mailOptions.to,
            name: mailOptions.to,
          },
        },
      ],
      subject: mailOptions.subject,
      htmlbody: mailOptions.html,
    })
    .then(() => {
      if (process.env.status === "development") {
        console.log("Email sent successfully in development mode");
      }
    })
    .catch((error) => console.error("Email failed to send", error.details));
}
