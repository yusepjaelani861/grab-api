import GrabMal from "../controllers/mal";
import express from "express";

const router = express.Router();

router.route("/anime/:id").get((new GrabMal()).getAnimeInfo);

export default router;
