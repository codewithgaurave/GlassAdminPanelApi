// routes/cartRoutes.js
import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../controllers/cartController.js";
import { authenticateUser } from "../middleware/userAuth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticateUser);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item/:itemId", updateCartItem);
router.delete("/item/:itemId", removeFromCart);
router.delete("/clear", clearCart);

export default router;