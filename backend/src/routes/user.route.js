import { Router } from "express";
import { clerkClient, requireAuth, getAuth } from "@clerk/express";

const router = Router();

router.get("/", (req, res) => {
  const { userId, sessionId, getToken } = req.auth;

  console.log("User ID:", userId);
  console.log("Session ID:", sessionId);
  console.log("Token:", getToken());

  res.status(200).json({
    message: "Welcome to the User API",
    status: "success",
  });
});

router.get("/protected", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);

  const user = await clerkClient.users.getUser(userId);

  return res.json({ user });
});

export default router;
