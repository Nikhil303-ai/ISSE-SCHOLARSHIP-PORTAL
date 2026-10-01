from knowledge_base import get_scholarship_knowledge


knowledge = get_scholarship_knowledge()

print("Total scholarships:", len(knowledge))

for item in knowledge:
    print("\n-----------------------------")
    print("Scholarship ID:", item["scholarshipId"])
    print(item["text"])