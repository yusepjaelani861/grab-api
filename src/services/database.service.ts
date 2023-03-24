import * as mongoDB from "mongodb";
import dotenv from "dotenv";

dotenv.config();
export const collections: {
  anime?: mongoDB.Collection;
  kusonime?: mongoDB.Collection;
  komikcast?: mongoDB.Collection;
  chapterKomikcast?: mongoDB.Collection;
} = {};

export const connect = async () => {
  const client: mongoDB.MongoClient = await mongoDB.MongoClient.connect(
    process.env.MONGO_URI || ""
  );
  await client.connect();

  const db = client.db("grab-api");
  const animeCollection: mongoDB.Collection = db.collection("anime");
  const kusonimeCollection: mongoDB.Collection = db.collection("kusonime");
  const komikcastCollection: mongoDB.Collection = db.collection("komikcast");
  const chapterKomikcastCollection: mongoDB.Collection =
    db.collection("chapter_komikcast");

  collections.anime = animeCollection;
  collections.kusonime = kusonimeCollection;
  collections.komikcast = komikcastCollection;
  collections.chapterKomikcast = chapterKomikcastCollection;

  console.log("Connected to database");
};
