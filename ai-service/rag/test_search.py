import json
from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer


rag_folder = Path(__file__).parent

# Load the saved FAISS index
index = faiss.read_index(str(rag_folder / "scholarships.index"))

# Load scholarship text
with open(rag_folder / "scholarships.json", "r", encoding="utf-8") as file:
    knowledge = json.load(file)

# Load the same embedding model used to build the index
model = SentenceTransformer("all-MiniLM-L6-v2")


def search_scholarships(question, top_k=2):
    question_embedding = model.encode(
        [question],
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    question_embedding = question_embedding.astype("float32")

    scores, indices = index.search(question_embedding, top_k)

    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue

        print("\nSimilarity score:", round(float(score), 3))
        print(knowledge[idx]["text"])


if __name__ == "__main__":
    question = input("Ask a scholarship question: ")
    search_scholarships(question)