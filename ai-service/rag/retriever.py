import json
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

RAG_FOLDER = Path(__file__).parent

# Load embedding model once when the module initializes
model = SentenceTransformer("all-MiniLM-L6-v2",)


def retrieve_context(question: str, top_k: int = 3):
    """
    Dynamically reads the latest FAISS index and JSON knowledge base from disk on each query 
    so admin additions and deletions reflect in real time without restarting Uvicorn.
    """
    index_path = RAG_FOLDER / "scholarships.index"
    json_path = RAG_FOLDER / "scholarships.json"

    # Safety check: return empty context if index files haven't been generated yet
    if not index_path.exists() or not json_path.exists():
        return []

    # Read live index and knowledge base directly from disk
    index = faiss.read_index(str(index_path))

    with open(json_path, "r", encoding="utf-8") as file:
        knowledge = json.load(file)

    if not knowledge:
        return []

    # Encode user question
    question_embedding = model.encode(
        [question],
        convert_to_numpy=True,
        normalize_embeddings=True
    ).astype("float32")

    # Search top_k nearest vectors
    scores, indices = index.search(question_embedding, min(top_k, len(knowledge)))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue

        if 0 <= idx < len(knowledge):
            results.append({
                "scholarshipId": knowledge[idx]["scholarshipId"],
                "text": knowledge[idx]["text"],
                "similarity": float(score)
            })

    return results