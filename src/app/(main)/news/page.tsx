"use client";

import { useEffect, useState } from "react";
import Loading from "../Components/Loading";
import { Article } from '@/types/common' 

export default function News() {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getNews() {
      setLoading(true);
      try {
        const res = await fetch("/api/fetchNews");
        const data = await res.json();
        setNews(data || []);
      } catch (err) {
        console.error("Error fetching news from API:", err);
      } finally {
        setLoading(false);
      }
    }

    getNews();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="mb-8 bg-slate-100 dark:bg-gray-900 p-6 min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300 underline decoration-blue-300 dark:decoration-gray-600 decoration-2 underline-offset-8">
        News
      </h2>

      <div className="grid gap-4">
        {news.map((article) => (
          <a
            key={article.uuid}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-4 hover:shadow-lg transition-shadow"
          >
            <img
              src={article.image_url}
              alt="News"
              onError={(e) => e.target.src = "/images/default-news.jpg"}
              className="w-32 h-32 object-cover rounded-lg"
            />
            <div className="ml-4 flex-1">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {article.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {article.snippet}
              </p>
              <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {new Date(article.published_at).toLocaleDateString("en-SA")}
                </span>
                <span className="mx-2">•</span>
                <span>{article.source}</span>
                {article.entities?.map((entity) => (
                  <div key={entity.symbol} className="flex flex-row space-x-2 items-center">
                    <span
                      key={entity.symbol}
                      className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full"
                    >
                      {entity.symbol}
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full ${
                        entity.sentiment_score < 0
                          ? "bg-red-200 dark:bg-red-900"
                          : entity.sentiment_score > 0
                          ? "bg-green-200 dark:bg-green-900"
                          : "bg-gray-200 dark:bg-gray-900"
                      }`}
                    >
                      {entity.sentiment_score < 0
                        ? "Negative"
                        : entity.sentiment_score > 0
                        ? "Positive"
                        : "Neutral"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div></div>
          </a>
        ))}
      </div>
    </div>
  );
}
