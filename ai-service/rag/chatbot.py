import os

from dotenv import load_dotenv
from google import genai

from rag.retriever import retrieve_context


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from the .env file.")

client = genai.Client(api_key=api_key)


def answer_question(question: str):
    results = retrieve_context(question, top_k=2)

    if not results:
        return "I couldn't find relevant information in the available scholarship records."

    context = "\n\n".join(result["text"] for result in results)

    prompt = f"""
You are the ISSE scholarship assistance chatbot.

Answer the student's question using only the scholarship context below.

Rules:
- Do not invent eligibility rules, benefits, documents, deadlines, or steps.
- If the context does not contain an answer, say that the available records
  do not provide that information.
- Do not claim that a student is officially eligible.
- Tell students to confirm current details with the official scholarship source.
- Give a clear, helpful answer in simple language.

SCHOLARSHIP CONTEXT:
{context}

STUDENT QUESTION:
{question}
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    return response.text or "I couldn't generate an answer. Please try again."


if __name__ == "__main__":
    question = input("Ask the ISSE scholarship chatbot: ")

    try:
        print("\nChatbot answer:\n")
        print(answer_question(question))
    except Exception as error:
        print("\nChatbot error:", error)