"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StockRiskTable from "../Components/StockRiskTable";
import { formatCurrency } from "@/utils/formatters";

// --- Types ---
type AICategorizedStock = {
  ticker: string;
  risk_level: string;
  [key: string]: unknown;
};

type PortfolioItem = {
  company_name: string;
  sector: string;
  share_price: number;
  number_of_stocks: number;
};

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

// --- Helper Function ---
function splitAiOutput(aiResponse: string): {
  categorizedStocks: AICategorizedStock[];
  recommendation: string;
} {
  const jsonStart = aiResponse.indexOf("[");
  const jsonEnd = aiResponse.indexOf("]") + 1;

  const jsonString = aiResponse.slice(jsonStart, jsonEnd);
  const recommendation = aiResponse.slice(jsonEnd, -3).trim();

  let categorizedStocks: AICategorizedStock[] = [];

  try {
    categorizedStocks = JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON from AI response:", error);
  }

  return {
    categorizedStocks,
    recommendation,
  };
}

// --- Component ---
export default function AssistantPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [actionResponse, setActionResponse] = useState<{
    action: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    const fetchFollowedStocks = async () => {
      try {
        const res = await fetch("/api/followStock", { method: "GET" });
        const data: PortfolioItem[] = await res.json();

        if (res.ok) {
          setPortfolio(data);
        } else {
          console.error("Error fetching followed stocks:", data);
        }
      } catch (err) {
        console.error("Failed to fetch followed stocks:", err);
      }
    };

    fetchFollowedStocks();
  }, []);

  const handleAction = async (action: string, customPrompt?: string) => {
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, customPrompt, portfolio }),
      });

      const data = await res.json();

      if (action !== "custom") {
        setActionResponse({
          action,
          content: data.reply || "No reply received.",
        });
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "ai", content: data.reply || "No reply received." },
        ]);
      }
    } catch (err) {
      console.error(err);
      const fallbackMessage =
        action !== "custom"
          ? "Something went wrong."
          : "Failed to contact assistant.";

      if (action !== "custom") {
        setActionResponse({ action, content: fallbackMessage });
      } else {
        setChatHistory((prev) => [...prev, { role: "ai", content: fallbackMessage }]);
      }
    }

    setLoading(false);
  };

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMsg: ChatMessage = { role: "user", content: userInput };
    setChatHistory((prev) => [...prev, newMsg]);
    setUserInput("");
    await handleAction("custom", newMsg.content);
  };

  return (
    <div className="p-8 bg-slate-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-800 dark:text-blue-300">
        AI Investment Assistant
      </h1>

      {/* Portfolio Table */}
      <div className="overflow-x-auto mb-8 shadow rounded-lg">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Sector</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2"># of Stocks</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item, index) => (
              <tr
                key={index}
                className="text-center border-t dark:border-gray-600 font-SaudiRiyal"
              >
                <td className="px-4 py-2">{item.company_name}</td>
                <td className="px-4 py-2">{item.sector}</td>
                <td className="px-4 py-2">{formatCurrency(item.share_price)}</td>
                <td className="px-4 py-2">{item.number_of_stocks}</td>
              </tr>
            ))}
            {portfolio.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  You haven&apos;t followed any stocks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Result Panel */}
      {(loading || actionResponse) && (
        <div className="w-full mx-auto mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center">
              <p className="text-blue-500">AI is generating results...</p>
            </div>
          ) : actionResponse ? (
            actionResponse.action === "risk" ? (
              <div>
                <StockRiskTable
                  stocks={splitAiOutput(actionResponse.content).categorizedStocks}
                />
                <div className="mt-4">
                  {splitAiOutput(actionResponse.content).recommendation}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400 capitalize">
                  {actionResponse.action}
                </h2>
                <div className="space-y-3 leading-relaxed text-gray-800 dark:text-gray-200">
                  {actionResponse.content.split("\n").map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </>
            )
          ) : null}
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <Button onClick={() => handleAction("summarize")}>Summarize</Button>
        <Button onClick={() => handleAction("evaluate")}>Evaluate</Button>
        <Button onClick={() => handleAction("risk")}>Risks</Button>
        <Button onClick={() => handleAction("suggest")}>Make Suggestions</Button>
        <Button variant="outline" onClick={() => setChatMode((prev) => !prev)}>
          {chatMode ? "Close Chat" : "Chat with AI"}
        </Button>
      </div>

      {/* Chat Section */}
      {chatMode && (
        <div className="w-full mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Ask AI Anything
          </h2>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-[300px] overflow-y-auto space-y-3 mb-4">
            {chatHistory.length === 0 && (
              <p className="text-gray-400 dark:text-gray-500 text-center">
                Ask a question and get real-time advice.
              </p>
            )}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-100 dark:bg-blue-900 self-end ml-auto text-right"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading && <p className="text-blue-500">AI is thinking...</p>}
          </div>

          <form onSubmit={handleSubmitChat} className="flex items-center gap-2">
            <Input
              placeholder="Ask something like &rsquo;Should I diversify?&rsquo;"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!userInput.trim() || loading}>
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
