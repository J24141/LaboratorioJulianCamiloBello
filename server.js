const express = require("express");
const gameRoutes = require("./routes/game.routes");
const plataformRoutes = require("./routes/plataform.routes");
const salesRoutes = require("./routes/sales.routes");
const launchRoutes = require("./routes/launch.routes");

const PORT = process.env.PORT || 5000;
const api = express();

api.use(express.json());
api.use(express.static("public"));

api.use("/game", gameRoutes);
api.use("/plataform", plataformRoutes);
api.use("/sales", salesRoutes);
api.use("/launch", launchRoutes);

api.listen(PORT, () => {
  console.log(`Server running in http://localhost:${PORT}`);
});