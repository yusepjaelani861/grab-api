import express from "express";
import dotenv from "dotenv";
import routes from "./routes";
import { connect } from "./services/database.service";
import errorHandler from "./middleware/error";

dotenv.config();
connect();

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use('/api', routes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
