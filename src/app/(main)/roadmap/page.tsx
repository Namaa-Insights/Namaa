"use client";
import React, { useState } from "react";

export default function FutureRoadmap() {
  const [votes, setVotes] = useState({
    "ai-insights": 0,
    "data-integration": 0,
    "collaboration": 0,
    "custom-reports": 0,
  });

  const [hasVoted, setHasVoted] = useState({
    "ai-insights": false,
    "data-integration": false,
    "collaboration": false,
    "custom-reports": false,
  });

  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Feedback submitted:", { feedback, email });
    setFeedback("");
    setEmail("");
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="mb-8 bg-slate-100 dark:bg-gray-900 p-6">
      <h2 className="text-xl font-semibold mb-6 text-blue-900 dark:text-blue-300 underline decoration-blue-300 dark:decoration-gray-600 decoration-2 underline-offset-8">
        Future Roadmap – What&rsquo;s Coming Next?
      </h2>

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 shadow-md rounded-lg overflow-hidden p-6 mb-6">
        <p className="text-gray-700 dark:text-gray-300">
          We&rsquo;re constantly working to improve Namaa Insights and add valuable features.
          Here&rsquo;s what we&rsquo;re planning for upcoming releases. Your feedback helps us
          prioritize what matters most to you!
        </p>
      </div>

      {/* ... [ Timeline content stays unchanged except for fixed apostrophes ] */}

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 shadow-md rounded-lg overflow-hidden p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
          Help Shape Our Future
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          Have a feature idea or suggestion? We&rsquo;d love to hear from you!
        </p>

        {isSubmitted && (
          <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 p-4 rounded-lg text-center mb-4">
            Thank you for your feedback! We&rsquo;ll take it into consideration for our roadmap.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Suggestion
            </label>
            <textarea
              id="feedback"
              rows={4}
              className="w-full px-3 py-2 text-gray-700 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600"
              placeholder="I&rsquo;d like to see..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 text-gray-700 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We&rsquo;ll notify you when your suggested feature is implemented.
            </p>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
