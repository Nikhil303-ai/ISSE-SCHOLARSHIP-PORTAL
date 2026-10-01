import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL } from "./api";

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm the ISSE Scholarship Assistant. Ask me about scholarship eligibility, documents, or application steps.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSubmit(event) {
    if (event) event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: trimmedQuestion },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "The chatbot request failed.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer || "I couldn't generate an answer. Please try again.",
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Sorry, something went wrong: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full py-6 font-sans">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header - Dark Theme */}
        <header className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-white">ISSE Scholarship Assistant</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask questions about scholarships, eligibility, and requirements
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-full shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Assistant
          </span>
        </header>

        {/* Message Container - Dark Theme */}
        <div className="h-96 overflow-y-auto p-5 space-y-4 bg-slate-950">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-auto bg-blue-600 text-white rounded-br-none"
                  : "mr-auto bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none shadow-sm"
              }`}
            >
              <span
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  message.role === "user" ? "text-blue-200" : "text-blue-400"
                }`}
              >
                {message.role === "user" ? "You" : "ISSE Assistant"}
              </span>

              <div className="prose prose-invert prose-sm max-w-none text-inherit leading-normal">
                <ReactMarkdown>
                  {message.text
                    .replaceAll("\\*", "*")
                    .replaceAll("\\_", "_")
                    .replaceAll("\\[", "[")                     .replaceAll("\\]", "]")
                    .replaceAll("&#x20;", " ")}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="max-w-xl mr-auto p-4 rounded-2xl rounded-bl-none bg-slate-800 border border-slate-700 text-slate-100 shadow-sm text-sm flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <p className="text-slate-400 italic">Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form Input - Dark Theme */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask your scholarship question..."
            aria-label="Your scholarship question"
            disabled={loading}
            className="flex-1 p-2.5 text-sm bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-slate-900"
          />

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>

        <p className="px-5 pb-4 text-[11px] text-slate-500 leading-normal bg-slate-900">
          Answers are generated using RAG vector records. Always verify final eligibility details with official providers.
        </p>
      </div>
    </div>
  );
}