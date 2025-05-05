import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ArticleFromAPI = {
  uuid: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string;
  source: string;
  entities: any[];
  snippet: string;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiToken = process.env.MARKETAUX_API_TOKEN;
    const url = `https://api.marketaux.com/v1/news/all?countries=sa&filter_entities=true&api_token=${apiToken}`;
    const response = await fetch(url);
    const { data: news }: { data: ArticleFromAPI[] } = await response.json();

    const supabase = await createClient();
    const upsertResult = await supabase.from("news_articles").upsert(
      news.map((article: ArticleFromAPI) => ({
        uuid: article.uuid,
        title: article.title,
        description: article.description,
        url: article.url,
        image_url: article.image_url,
        published_at: article.published_at,
        source: article.source,
        entities: article.entities,
        snippet: article.snippet,
      })),
      { onConflict: "uuid" }
    );

    if (upsertResult.error) throw upsertResult.error;

    return NextResponse.json({ message: `Updated ${news.length} articles` });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update news" },
      { status: 500 }
    );
  }
}
