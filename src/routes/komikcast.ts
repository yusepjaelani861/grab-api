import express from "express";
import GrabKomikcast from "../controllers/komikcast";
import cache from "../middleware/cache";

const router = express.Router();

router.route("/komik").get(cache(120 * 60), new GrabKomikcast().getKomikList);
router.route("/komik/:slug").get(new GrabKomikcast().getPageInfo);
router.route("/chapter/:slug").get(new GrabKomikcast().getChapterData);

export default router;
