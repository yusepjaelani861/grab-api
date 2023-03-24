import asyncHandler from "../middleware/async";
import cheerio from "cheerio";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { sendResponse, sendError } from "../libraries/rest";
import { collections } from "../services/database.service";

class GrabKusonime {
  private url: string;

  public constructor() {
    this.url = "https://kusonime.com";
  }

  public getPageInfo = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { slug } = req.params;

      const cek_kusonime = await collections.kusonime?.findOne({
        slug: slug,
      });

      if (cek_kusonime) {
        if (cek_kusonime.updated_at < new Date().getTime() - 86400000) {
          let data: any = await this.scrapeDataPage(`${this.url}/${slug}`);
          data.updated_at = new Date().getTime();

          await collections.kusonime?.updateOne(
            { slug: slug },
            { $set: data },
            { upsert: true }
          );

          return res.json(new sendResponse(data, "Success getting data"));
        }

        return res.json(new sendResponse(cek_kusonime, "Success getting data"));
      }

      try {
        let data: any = await this.scrapeDataPage(`${this.url}/${slug}`);
        data.slug = slug;

        await collections.kusonime?.insertOne(data);

        return res.json(new sendResponse(data, "Success getting data"));
      } catch (error) {
        return res.json(
          new sendError("Failed to get data", [], "PROCESS_ERROR", 400)
        );
      }
    }
  );

  public getAnimeList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = req.query.page || 1;

      const response: any = await axios.get(
        `${this.url}/list-anime-batch-sub-indo/page/${page}`
      );

      const $ = cheerio.load(response.data);

      const list = $('div[id="abtext"]').find('div[class="penzbar"]');
      const anime = list
        .map((i, el) => {
          let title = $(el)
            .find('div[class="jdlbar"]')
            .find('a[class="kmz"]')
            .text();
          if (title !== "") {
            return {
              title: title,
              url: $(el)
                .find('div[class="jdlbar"]')
                .find('a[class="kmz"]')
                .attr("href")
                ?.replace(this.url, "")
                .replace("/", "")
                .replace("/", ""),
            };
          }
        })
        .get();

      const total_anime = anime.length;

      const pagination = $('div[class="navigation"]');
      const next_page = pagination
        .find('a[class="nextpostslink"]')
        .attr("href")
        ?.replace(this.url, "");
      let has_next_page = false;
      if (next_page !== undefined) {
        has_next_page = true;
      }

      res.json(
        new sendResponse(
          {
            has_next_page,
            total_anime,
            anime,
          },
          "Success getting data"
        )
      );
    }
  );

  public scrapeDataPage = async (url: string) => {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title = $('h1[class="jdlz"]').text();
    let image: any = $('div[class="post-thumb"]').find("img").attr("src");

    const detail = $('div[class="lexot"]');
    const description = detail.find("p").eq(10).text();
    const credit = detail.find("p").eq(11).text();
    const keywords = detail.find("p").eq(13).text();

    const info = $('div[class="info"]');
    const japanese = info.find("p").eq(0).text();
    const genres = info
      .find("p")
      .eq(1)
      .find("a")
      .map((i, el) => {
        return {
          name: $(el).text(),
          url: $(el)
            .attr("href")
            ?.replace(this.url, "")
            .replace("/genres/", "")
            .replace("/", ""),
        };
      })
      .get();
    const seasons = info
      .find("p")
      .eq(2)
      .find("a")
      .map((i, el) => {
        return {
          name: $(el).text(),
          url: $(el)
            .attr("href")
            ?.replace(this.url, "")
            .replace("/seasons/", "")
            .replace("/", ""),
        };
      })
      .get();
    const producers = info.find("p").eq(3).text().replace("Producers: ", "");
    const type = info.find("p").eq(4).text().replace("Type: ", "");
    const status = info.find("p").eq(5).text().replace("Status: ", "");
    const total_episode = info
      .find("p")
      .eq(6)
      .text()
      .replace("Total Episode: ", "");
    const score = info.find("p").eq(7).text().replace("Score: ", "");
    const duration = info.find("p").eq(8).text().replace("Duration: ", "");
    const released_on = info
      .find("p")
      .eq(9)
      .text()
      .replace("Released on: ", "");

    const dlbox = $('div[class="dlbod"]');
    const smokeurl = dlbox.find('div[class="smokeurl"]');
    const download_url = smokeurl
      .map((i, el) => {
        return {
          name: $(el).find("strong").text(),
          children: $(el)
            .find("a")
            .map((i, el) => {
              return {
                name: $(el).text(),
                url: $(el).attr("href"),
              };
            })
            .get(),
        };
      })
      .get();

    let data = {
      title,
      japanese,
      genres,
      seasons,
      producers,
      type,
      status,
      total_episode,
      score,
      duration,
      released_on,
      image,
      description,
      credit,
      keywords,
      download_url,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    };

    return data;
  };
}

export default GrabKusonime;
