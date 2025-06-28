import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect everything except Next.js internals, static files, AND sign-in/up routes:
    '/((?!_next|.*\\.(?:png|jpg|jpeg|svg|gif|ico|css|js|json|webmanifest|ttf|woff|woff2|map|txt|xml)|sign-in(.*)|sign-up(.*)).*)',
    
    // Protect API and trpc routes always
    '/(api|trpc)(.*)',
  ],
};
