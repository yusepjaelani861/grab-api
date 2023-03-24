import axios from "axios";
import { NextFunction, Request, Response } from "express";
import asyncHandler from "../middleware/async";
import { collections } from "../services/database.service";
import { sendResponse, sendError } from "../libraries/rest";
import dotenv from "dotenv";
dotenv.config();

class GrabMal {
  private urlMal: string;
  private urlTranslate: string;

  public constructor() {
    const apiKey = process.env.YANDEX_API_TRANSLATE || "";
    this.urlMal = "https://api.jikan.moe/v4/anime/";
    this.urlTranslate = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${apiKey}&text=`;
  }

  public getAnimeInfo = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const url = this.urlMal + id;

      try {
        const cek_anime = await collections.anime?.findOne({
          mal_id: parseInt(id),
        });

        if (cek_anime) {
          return res.json(cek_anime);
        }
        const response = await axios.get(url);

        const { synopsis } = response.data.data;

        let data = response.data.data;

        const translate = await this.translate(synopsis);
        data.synopsis = translate.text[0];

        let insert = await collections.anime?.insertOne(data);
        console.log(insert);

        return res.json(new sendResponse(data, "Success getting data"));
      } catch (error: any) {
        console.log(error);
        return next(
          new sendError(error?.mesage, error?.data, "PROCESS_ERROR", 400)
        );
      }
    }
  );

  public async translate(text: string, lang: string = "id") {
    text = text.replace(/[/"";]/g, "");
    text = encodeURIComponent(text);
    const url = this.urlTranslate + text + "&lang=" + lang;
    const response = await axios.get(url);
    return response.data;
  }
}

export default GrabMal;
