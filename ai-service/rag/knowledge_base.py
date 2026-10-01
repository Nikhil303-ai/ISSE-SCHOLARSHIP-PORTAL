import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

load_dotenv()

client = MongoClient(
    os.getenv("MONGODB_URI"),
    tls=True,
    tlsCAFile=certifi.where()
)

db = client["isse"]
scholarships_collection = db["scholarships"]


def get_scholarship_knowledge():
    scholarships = list(
        scholarships_collection.find({})
    )

    knowledge = []

    for scholarship in scholarships:
        eligibility = scholarship.get(
            "eligibility", {}
        )

        text = f"""
Scholarship: {scholarship.get("title", "")}

Provider: {scholarship.get("provider", "")}

Description: {scholarship.get("description", "")}

Eligibility:
Minimum percentage:
{eligibility.get("minPercentage")}

Maximum family income:
{eligibility.get("maxIncome")}

Categories:
{", ".join(eligibility.get("categories", []))}

States:
{", ".join(eligibility.get("states", []))}

Courses:
{", ".join(eligibility.get("courses", []))}

Gender:
{eligibility.get("gender", "Any")}

Education level:
{", ".join(eligibility.get("educationLevel", []))}

Boards:
{", ".join(eligibility.get("boards", []))}

Institution conditions:
{" ".join(eligibility.get("institutionConditions", []))}

Other conditions:
{" ".join(eligibility.get("otherConditions", []))}

Benefits:
{" ".join(scholarship.get("benefits", []))}

Documents:
{" ".join(scholarship.get("documents", []))}

Application process:
{" ".join(scholarship.get("applicationProcess", []))}

Application start:
{scholarship.get("applicationStart")}

Deadline:
{scholarship.get("deadline")}

Official URL:
{scholarship.get("officialUrl")}

Source:
{scholarship.get("source")}

Verification status:
{scholarship.get("verificationStatus")}

Last verified:
{scholarship.get("lastVerified")}
"""

        knowledge.append({
            "scholarshipId": str(
                scholarship["_id"]
            ),
            "text": text.strip()
        })

    return knowledge