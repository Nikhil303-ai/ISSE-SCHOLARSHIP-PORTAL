from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from dotenv import load_dotenv
from rag.chatbot import answer_question
import os
import certifi


load_dotenv()

app = FastAPI(title="ISSE AI Service")

# CORS Middleware to allow requests from React and Node.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient(
    os.getenv("MONGODB_URI"),
    tls=True,
    tlsCAFile=certifi.where()
)
db = client["isse"]
scholarships_collection = db["scholarships"]


# -----------------------------
# Student Profile
# -----------------------------

class StudentProfile(BaseModel):
    percentage: float = Field(default=0.0, alias="academicPercentage")
    income: float = Field(default=0.0, alias="annualIncome")
    category: str = "General"
    state: str = "Uttar Pradesh"
    course: str = "B.Tech"
    year: int = 1
    gender: str = "Any"

    educationLevel: str | None = None
    board: str | None = None
    class12Percentile: float | None = None

    class Config:
        populate_by_name = True


# -----------------------------
# Home
# -----------------------------

@app.get("/")
def home():
    return {
        "message": "ISSE AI service is running"
    }


# -----------------------------
# Recommendation Engine
# -----------------------------

@app.post("/recommend")
def recommend_scholarships(student: StudentProfile):

    scholarships = list(scholarships_collection.find({}))
    recommendations = []

    for scholarship in scholarships:

        eligibility = scholarship.get(
            "eligibility", {}
        )

        eligible = True
        reasons = []
        score = 0

        # -------------------------
        # Academic percentage
        # Weight: 20
        # -------------------------

        min_percentage = eligibility.get(
            "minPercentage"
        )

        if min_percentage is not None:

            if student.percentage < min_percentage:
                eligible = False
            else:
                score += 20
                reasons.append(
                    "Academic requirement satisfied"
                )

        else:
            score += 20
            reasons.append(
                "No minimum academic percentage specified"
            )

        # -------------------------
        # Family income
        # Weight: 20
        # -------------------------

        max_income = eligibility.get(
            "maxIncome"
        )

        if max_income is not None:

            if student.income > max_income:
                eligible = False
            else:
                score += 20
                reasons.append(
                    "Income requirement satisfied"
                )

        else:
            score += 20
            reasons.append(
                "No maximum income specified"
            )

        # -------------------------
        # Category
        # Weight: 20
        # -------------------------

        categories = eligibility.get("categories", [])

        if categories:
            allowed_categories = {
                str(category).strip().casefold()
                for category in categories
            }

            student_category = student.category.strip().casefold()

            if student_category in allowed_categories or "any" in allowed_categories or "general" in allowed_categories:
                score += 20
                reasons.append("Category matches")
            else:
                eligible = False

        # -------------------------
        # State
        # Weight: 15
        # -------------------------

        states = eligibility.get("states", [])

        if states:
            state_aliases = {
                "up": "uttar pradesh",
                "uttar pradesh": "uttar pradesh",
            }

            student_state = student.state.strip().casefold()
            student_state = state_aliases.get(student_state, student_state)

            allowed_states = {
                state_aliases.get(str(state).strip().casefold(),
                                  str(state).strip().casefold())
                for state in states
            }

            if student_state in allowed_states or "any" in allowed_states:
                score += 15
                reasons.append("State matches")
            else:
                eligible = False
        else:
            score += 15
            reasons.append("No state restriction")

        # -------------------------
        # Course
        # Weight: 15
        # -------------------------

        courses = eligibility.get("courses", [])

        if courses:
            course_aliases = {
                "b.tech": "bachelor of technology",
                "btech": "bachelor of technology",
                "bachelor of technology": "bachelor of technology",
            }

            student_course = student.course.strip().casefold()
            student_course = course_aliases.get(student_course, student_course)

            allowed_courses = {
                course_aliases.get(str(course).strip().casefold(),
                                   str(course).strip().casefold())
                for course in courses
            }

            if student_course in allowed_courses or "any" in allowed_courses:
                score += 15
                reasons.append("Course matches")
            else:
                eligible = False
        else:
            score += 15
            reasons.append("No course restriction")

        # -------------------------
        # Gender
        # Weight: 10
        # -------------------------

        gender = str(eligibility.get("gender", "Any")).strip().casefold()
        student_gender = student.gender.strip().casefold()

        if gender == "any":
            score += 5
            reasons.append("No gender restriction")
        elif student_gender == gender:
            score += 5
            reasons.append("Gender matches")
        else:
            eligible = False

        # Education level check
        education_levels = eligibility.get("educationLevel", [])

        if education_levels:
            if student.educationLevel in education_levels:
                score += 5
                reasons.append("Education level matches")
            else:
                eligible = False

        # Board check
        boards = eligibility.get("boards", [])

        if boards:
            if student.board in boards:
                reasons.append("Board matches")
            else:
                eligible = False

        # Class XII percentile check
        required_percentile = eligibility.get(
            "requiredClass12Percentile"
        )

        if required_percentile is not None:

            if student.class12Percentile is None:
                eligible = False
                reasons.append(
                    "Class XII percentile information required"
                )

            elif student.class12Percentile >= required_percentile:
                reasons.append(
                    "Class XII percentile requirement satisfied"
                )

            else:
                eligible = False

        # -------------------------
        # Only recommend eligible
        # scholarships
        # -------------------------

        if eligible:
            recommendations.append({
                "scholarshipId": str(scholarship["_id"]),
                "title": scholarship["title"],
                "provider": scholarship["provider"],
                "score": score,
                "eligibility": "eligible",
                "reasons": reasons,
                "deadline": scholarship.get("deadline"),
                "benefits": scholarship.get("benefits", []),
                "officialUrl": scholarship.get("officialUrl"),
                "verificationStatus": scholarship.get(
                    "verificationStatus",
                    "pending"
                ),
                "lastVerified": scholarship.get("lastVerified")
            })

    # Highest score first
    recommendations.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return {
        "count": len(recommendations),
        "recommendations": recommendations
    }


class ChatRequest(BaseModel):
    question: str


@app.post("/chat")
def chat(request: ChatRequest):
    answer = answer_question(request.question)

    return {
        "question": request.question,
        "answer": answer
    }