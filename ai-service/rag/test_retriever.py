from retriever import retrieve_context


question = input("Ask a scholarship question: ")

results = retrieve_context(question)

for result in results:
    print("\nSimilarity:", round(result["similarity"], 3))
    print(result["text"])
    