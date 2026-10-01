import json
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from knowledge_base import get_scholarship_knowledge


# Load scholarship information from MongoDB
knowledge = get_scholarship_knowledge()

if not knowledge:
    raise ValueError("No scholarship data found in MongoDB.")

texts = [item["text"] for item in knowledge]

# Load the embedding model
print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# Convert scholarship text into embeddings
print("Creating embeddings...")
embeddings = model.encode(
    texts,
    convert_to_numpy=True,
    normalize_embeddings=True
)

embeddings = np.asarray(embeddings, dtype="float32")

# Build the FAISS similarity-search index
index = faiss.IndexFlatIP(embeddings.shape[1])
index.add(embeddings)

# Save the index and scholarship text
rag_folder = Path(__file__).parent
faiss.write_index(index, str(rag_folder / "scholarships.index"))

with open(rag_folder / "scholarships.json", "w", encoding="utf-8") as file:
    json.dump(knowledge, file, ensure_ascii=False, indent=2)

print(f"Index created successfully. Scholarships indexed: {index.ntotal}")