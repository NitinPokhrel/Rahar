import { Inter } from "next/font/google";
import "./styles/globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Shopylib: Your All-in-One Marketplace for Quality Products | Shop with Confidence",
  description: "Discover a vast selection of top brands and products at Shopylib, your one-stop ecommerce platform. Whether you’re a customer looking for the best deals, a vendor ready to showcase your products, or an admin managing the marketplace, Shopylib offers a seamless shopping experience. Shop with confidence, and enjoy secure payments, fast shipping, and excellent customer service.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
          {children}
      </body>
    </html>
  );
}
