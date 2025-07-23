// Preferring Zeptomail for transactional emails
// This file is responsible for sending emails using Zeptomail's API

import { SendMailClient } from "zeptomail";

const url = "api.zeptomail.com/";
const token = process.env.ZEPTOMAIL_API_KEY;

const client = new SendMailClient({ url, token });

export function sendMail(mailOptions) {
  if (
    process.env.status === "development" &&
    mailOptions.to !== "ujjwalint22@gmail.com"
  ) {
    console.log("Email is not sent as it is not sent to ujjwalint22@gmail.com");
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
    .then(() => console.log("Email sent successfully"))
    .catch((error) => console.error("Email failed to send", error));
}
