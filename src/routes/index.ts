import express from "express";
import malRoute from "./mal";
import kusonimeRoute from "./kusonime";
import komikcastRoute from "./komikcast";

const router = express.Router();

router.use("/mal", malRoute);
router.use("/kusonime", kusonimeRoute);
router.use("/komikcast", komikcastRoute);

export default router;
