"use client"

import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 overflow-hidden py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4">
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Customer Service</h3>
          <ul>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Contact Us</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Track Order</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Returns & Refunds</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Shipping Info</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">FAQ</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Company</h3>
          <ul>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">About Us</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Careers</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Press Releases</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Affiliate Program</li>
            <li className="mb-2 hover:text-gray-100 cursor-pointer">Terms & Conditions</li>
          </ul>
        </div>

        
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Stay Connected</h3>
          <p className="mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
          <div className="flex mb-6">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 w-full rounded-l-md text-black"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md">
              Subscribe
            </button>
          </div>

          <div className="flex space-x-4">
            <a href="#" aria-label="Facebook" className="hover:text-white">
              <FaFacebook size={24} />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-white">
              <FaInstagram size={24} />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-white">
              <FaTwitter size={24} />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-white">
              <FaLinkedin size={24} />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-white">
              <FaYoutube size={24} />
            </a>
          </div>
        </div>

        
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">We Accept</h3>
          <p className="mb-4">Secure Payment Gateways</p>
          <div className="flex space-x-4">
            {/* <img src="/images/payment-visa.png" alt="Visa" className="h-8" />
            <img src="/images/payment-mastercard.png" alt="MasterCard" className="h-8" />
            <img src="/images/payment-paypal.png" alt="PayPal" className="h-8" />
            <img src="/images/payment-amex.png" alt="Amex" className="h-8" /> */}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-12 py-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Shopylib. All rights reserved.</p>
        <p>Powered by Next.js | Developed by Milan Bhattarai</p>
      </div>
    </footer>
  );
};

export default Footer;
