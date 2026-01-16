// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import moment from "moment-timezone";

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// User routes
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import userOrderRoutes from "./routes/userOrderRoutes.js";

const app = express();

/* -------------------- SECURITY -------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false, // ⚠️ Cloudinary / frontend safe
  })
);

const allowedOrigins = [
  "https://espejo-kappa.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204, // 🔥 VERY IMPORTANT
  })
);

app.options("*", cors());
/* -------------------- MIDDLEWARE -------------------- */
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/* -------------------- RATE LIMIT -------------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use("/api/admin/login", authLimiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

/* -------------------- DB -------------------- */
await connectDB();
console.log(
  "⏳ Time:",
  moment().tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A")
);

/* -------------------- ROUTES -------------------- */
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/payment", paymentRoutes);

// User
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/user-orders", userOrderRoutes);

/* -------------------- DEFAULT -------------------- */
app.get("/", (_req, res) => res.send("✅ API is running"));

app.get("/health", (_req, res) =>
  res.json({
    status: "OK",
    timeIST: moment().tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A"),
  })
);

/* -------------------- 404 -------------------- */
app.use((req, res) =>
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
);

/* -------------------- ERROR -------------------- */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
