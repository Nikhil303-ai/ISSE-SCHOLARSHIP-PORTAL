export const getRecommendations = async (studentProfile) => {
  const formattedProfile = {
    percentage: parseFloat(studentProfile.academicPercentage || studentProfile.percentage || 0),
    academicPercentage: parseFloat(studentProfile.academicPercentage || studentProfile.percentage || 0),
    income: parseFloat(studentProfile.annualIncome || studentProfile.income || 0),
    annualIncome: parseFloat(studentProfile.annualIncome || studentProfile.income || 0),
    category: studentProfile.category || "General",
    state: studentProfile.state || "Uttar Pradesh",
    course: studentProfile.course || "B.Tech",
    year: parseInt(studentProfile.yearOfStudy || studentProfile.year || 1),
    gender: studentProfile.gender || "Any",
    educationLevel: studentProfile.educationLevel || null,
    board: studentProfile.board || null,
    class12Percentile: studentProfile.class12Percentile ? parseFloat(studentProfile.class12Percentile) : null,
  };

  // Target FastAPI on port 8000 directly
  const response = await fetch("http://127.0.0.1:8000/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formattedProfile),
  });

  if (!response.ok) {
    throw new Error("Failed to get scholarship recommendations");
  }

  return response.json();
};