require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./db");

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  if (!MONGODB_URI) {
    throw new Error("Falta MONGODB_URI en el archivo .env");
  }

  await connectDB(MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Error al iniciar:", err.message);
  process.exit(1);
});