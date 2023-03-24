import { ObjectId } from "mongodb";

class Anime {
  constructor(
    public title: string,
    public title_english: string,
    public title_japanese: string,
    public synopsis: string,
    public episodes: number,
    public score: number,
    public type: string,
    public source: string,
    public status: string,
    public airing: boolean,
    public aired: {
      from: string;
      to: string;
      string: string;
    },
    public duration: string,
    public rating: string,
    public season: string,
    public producers: string[],
    public url: string,
    public images: string,
    public _id?: ObjectId
  ) {}
}

export default Anime
