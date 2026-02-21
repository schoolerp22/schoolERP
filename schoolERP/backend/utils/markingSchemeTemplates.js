// Preset marking scheme templates for different education boards

const MARKING_SCHEME_TEMPLATES = {
    CBSE: {
        scheme_name: "CBSE Standard",
        description: "Standard CBSE marking scheme with two terms",
        components: [
            {
                name: "Term 1",
                weight: 50,
                max_marks: 100,
                sub_components: [
                    { name: "Written Exam", weight: 80, max_marks: 80 },
                    { name: "Practical/Internal", weight: 20, max_marks: 20 }
                ]
            },
            {
                name: "Term 2",
                weight: 50,
                max_marks: 100,
                sub_components: [
                    { name: "Written Exam", weight: 80, max_marks: 80 },
                    { name: "Practical/Internal", weight: 20, max_marks: 20 }
                ]
            }
        ],
        grading_system: {
            type: "both",
            grade_ranges: [
                { grade: "A1", min: 91, max: 100, description: "Outstanding" },
                { grade: "A2", min: 81, max: 90, description: "Excellent" },
                { grade: "B1", min: 71, max: 80, description: "Very Good" },
                { grade: "B2", min: 61, max: 70, description: "Good" },
                { grade: "C1", min: 51, max: 60, description: "Fair" },
                { grade: "C2", min: 41, max: 50, description: "Average" },
                { grade: "D", min: 33, max: 40, description: "Pass" },
                { grade: "E", min: 0, max: 32, description: "Needs Improvement" }
            ]
        }
    },

    ICSE: {
        scheme_name: "ICSE Standard",
        description: "Standard ICSE marking scheme with semester system",
        components: [
            {
                name: "Semester 1",
                weight: 50,
                max_marks: 100,
                sub_components: [
                    { name: "Theory", weight: 70, max_marks: 70 },
                    { name: "Practical", weight: 20, max_marks: 20 },
                    { name: "Project Work", weight: 10, max_marks: 10 }
                ]
            },
            {
                name: "Semester 2",
                weight: 50,
                max_marks: 100,
                sub_components: [
                    { name: "Theory", weight: 70, max_marks: 70 },
                    { name: "Practical", weight: 20, max_marks: 20 },
                    { name: "Project Work", weight: 10, max_marks: 10 }
                ]
            }
        ],
        grading_system: {
            type: "percentage",
            grade_ranges: [
                { grade: "A+", min: 90, max: 100, description: "Excellent" },
                { grade: "A", min: 80, max: 89, description: "Very Good" },
                { grade: "B+", min: 70, max: 79, description: "Good" },
                { grade: "B", min: 60, max: 69, description: "Above Average" },
                { grade: "C", min: 50, max: 59, description: "Average" },
                { grade: "D", min: 40, max: 49, description: "Pass" },
                { grade: "F", min: 0, max: 39, description: "Fail" }
            ]
        }
    },

    STATE_BOARD: {
        scheme_name: "State Board Standard",
        description: "Standard State Board marking scheme with quarterly exams",
        components: [
            {
                name: "Quarterly Exam",
                weight: 20,
                max_marks: 100
            },
            {
                name: "Half Yearly Exam",
                weight: 30,
                max_marks: 100
            },
            {
                name: "Annual Exam",
                weight: 50,
                max_marks: 100,
                sub_components: [
                    { name: "Written", weight: 90, max_marks: 90 },
                    { name: "Practical", weight: 10, max_marks: 10 }
                ]
            }
        ],
        grading_system: {
            type: "both",
            grade_ranges: [
                { grade: "A+", min: 90, max: 100, description: "Outstanding" },
                { grade: "A", min: 75, max: 89, description: "Excellent" },
                { grade: "B+", min: 60, max: 74, description: "Very Good" },
                { grade: "B", min: 50, max: 59, description: "Good" },
                { grade: "C", min: 35, max: 49, description: "Pass" },
                { grade: "F", min: 0, max: 34, description: "Fail" }
            ]
        }
    },

    CUSTOM: {
        scheme_name: "Custom Scheme",
        description: "Create your own marking scheme",
        components: [
            {
                name: "Exam 1",
                weight: 100,
                max_marks: 100
            }
        ],
        grading_system: {
            type: "percentage",
            grade_ranges: [
                { grade: "A", min: 80, max: 100, description: "Excellent" },
                { grade: "B", min: 60, max: 79, description: "Good" },
                { grade: "C", min: 40, max: 59, description: "Pass" },
                { grade: "F", min: 0, max: 39, description: "Fail" }
            ]
        }
    }
};

export default MARKING_SCHEME_TEMPLATES;
