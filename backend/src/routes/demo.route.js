import { Router } from "express";

const router = Router();

// this is a sample route to demonstrate user works
router.get("/", async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      message: "Welcome to the User API",
      status: "success",
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
