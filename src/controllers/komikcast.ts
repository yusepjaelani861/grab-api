import asyncHandler from "../middleware/async";
import { sendResponse, sendError } from "../libraries/rest";
import { NextFunction, Request, Response } from "express";
import axios from "axios";
import cheerio from "cheerio";
import { collections } from "../services/database.service";

class GrabKomikcast {
  private url: string;

  public constructor() {
    this.url = "https://komikcast.site";
  }

  public getPageInfo = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { slug } = req.params;

      const cek_komikcast = await collections.komikcast?.findOne({
        slug: slug,
      });

      if (cek_komikcast) {
        if (cek_komikcast.updated_at < new Date().getTime() - 86400000) {
          let data = await this.scrapePage(`${this.url}/${slug}`);
          data.updated_at = new Date().getTime();

          await collections.komikcast?.updateOne(
            { slug: slug },
            { $set: data },
            { upsert: true }
          );

          return res.json(new sendResponse(data, "Success getting data"));
        }

        return res.json(
          new sendResponse(cek_komikcast, "Success getting data")
        );
      }

      try {
        let data: any = await this.scrapePage(`${this.url}/${slug}`);
        data.slug = slug;

        await collections.komikcast?.insertOne(data);

        return res.json(new sendResponse(data, "Success getting data"));
      } catch (error) {
        return res.json(
          new sendError("Failed to get data", [], "PROCESS_ERROR", 400)
        );
      }
    }
  );

  public getKomikList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const response = await axios.get(`${this.url}/daftar-komik/?list`);

        const $ = cheerio.load(response.data);

        const list = $('div[class="list-update"]')
          .find("li")
          .map((i, el) => {
            return {
              title: $(el).find("a").attr("class", "series").text(),
              url: $(el)
                .find("a")
                .attr("class", "series")
                .attr("href")
                ?.replace(this.url, "")
                .replace("/komik/", "")
                .replace("/", ""),
            };
          })
          .get();

        return res.json(new sendResponse(list, "Success getting data"));
      } catch (error) {
        return res.json(
          new sendError("Failed to get data", [], "PROCESS_ERROR", 400)
        );
      }
    }
  );

  public getChapterData = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { slug } = req.params;

      const cek_chapter = await collections.chapterKomikcast?.findOne({
        slug: slug,
      });

      if (cek_chapter) {
        return res.json(new sendResponse(cek_chapter, "Success getting data"));
      }

      try {
        const response: any = await axios.get(`${this.url}/chapter/${slug}`);
        const $ = cheerio.load(response.data);

        const slug_chapter = $('div[class="allc"]')
          .find("a")
          .attr("href")
          ?.replace(this.url, "")
          .replace("/komik/", "")
          .replace("/", "");

        const images = $('div[class="chapter_body"]')
          .find("div")
          .attr("class", "main-reading-area")
          .find("img")
          .map((i, el) => {
            return {
              index: i,
              image: $(el).attr("src"),
            };
          })
          .get();

        let cek_komikcast = await collections.komikcast?.findOne({
          slug: slug_chapter,
        });

        if (!cek_komikcast) {
          let data: any = await this.scrapePage(`${this.url}/${slug_chapter}`);
          data.slug = slug_chapter;

          await collections.komikcast?.insertOne(data);

          cek_komikcast = await collections.komikcast?.findOne({
            slug: slug_chapter,
          });
        }

        const chapter = await collections.chapterKomikcast?.findOne({
          slug: slug,
        });

        if (!chapter) {
          await collections.chapterKomikcast?.insertOne({
            slug: slug,
            images: images,
            slug_chapter: slug_chapter,
            komikcast_id: cek_komikcast?._id,
          });
        }

        return res.json(
          new sendResponse(
            {
              _id: null,
              slug_chapter,
              images,
              slug: slug,
              komikcast_id: cek_komikcast?._id,
            },
            "Success getting data"
          )
        );
      } catch (error) {
        return res.json(
          new sendError("Failed to get data", [], "PROCESS_ERROR", 400)
        );
      }
    }
  );

  public scrapePage = async (url: string) => {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const thumbnail = $('div[class="komik_info-content-thumbnail"]')
      .find("img")
      .attr("src");

    const content = $('div[class="komik_info-content-body"]');
    const title = content
      .find("h1")
      .attr("class", "komik_info-content-body-title")
      .text();
    const original = content
      .find("span")
      .attr("class", "komik_info-content-native")
      .eq(0)
      .text();
    const genre = content
      .find("span")
      .attr("class", "komik_info-content-genre")
      .find("a")
      .attr("class", "genre-item comedy")
      .attr("rel", "tag")
      .map((i, el) => {
        // if '/genres'
        if ($(el).attr("href")?.includes("/genres/")) {
          return {
            name: $(el).text(),
            slug: $(el)
              .attr("href")
              ?.replace(this.url, "")
              .replace("/genres/", "")
              .replace("/", ""),
          };
        }
      })
      .get();

    const meta = content.find("div").attr("class", "komik_info-content-meta");
    const released = meta
      .find("span")
      .attr("class", "komik_info-content-info-release")
      .eq(0)
      .text()
      .replace("Released:\n", "");
    const author = meta
      .find("span")
      .attr("class", "komik_info-content-info")
      .eq(1)
      .text()
      .replace("Author: ", "");
    const status = meta
      .find("span")
      .attr("class", "komik_info-content-info")
      .eq(2)
      .text()
      .replace("Status: ", "");
    const type = meta
      .find("span")
      .attr("class", "komik_info-content-info-type")
      .eq(3)
      .find("a")
      .map((i, el) => {
        return {
          name: $(el).text(),
          url: $(el)
            .attr("href")
            ?.replace(this.url, "")
            .replace("/type/", "")
            .replace("/", ""),
        };
      })
      .get();
    const total_chapter = meta
      .find("span")
      .attr("class", "komik_info-content-info")
      .eq(4)
      .text()
      .replace("Total Chapter: ", "");
    const updated_on = meta
      .find("span")
      .attr("class", "komik_info-content-update")
      .eq(5)
      .text()
      .replace("Updated on: ", "");

    const rating = $('div[class="komik_info-content-rating"]')
      .find("div")
      .attr("class", "data-rating")
      .attr("data-ratingkomik");
    const description = $('div[class="komik_info-description"]')
      .find("div")
      .attr("class", "komik_info-description-sinopsis")
      .find("p")
      .text();

    const chapter = $('div[class="komik_info-chapters"]')
      .find("ul")
      .attr("id", "chapter-wrapper")
      .attr("class", "komik_info-chapters-wrapper")
      .find("li")
      .map((i, el) => {
        return {
          title: $(el).find("a").attr("class", "chapter-link-item").text(),
          slug: $(el)
            .find("a")
            .attr("class", "chapter-link-item")
            .attr("href")
            ?.replace(this.url, "")
            .replace("/chapter/", "")
            .replace("/", ""),
          created_at: new Date(),
        };
      })
      .get();
    chapter.reverse();

    const data = {
      title,
      original,
      image: thumbnail,
      genres: genre,
      released,
      author,
      status,
      types: type,
      total_chapter,
      updated_on,
      rating,
      description,
      chapters: chapter,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    };

    return data;
  };
}

export default GrabKomikcast;
