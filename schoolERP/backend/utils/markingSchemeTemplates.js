// CBSE Stage-Specific Marking Scheme Templates
// Supports both CCE (FA/SA) and Modern CBSE evaluation modes

const CBSE_EXAM_TYPES = [
    // Term 1
    { code: "WEEKLY_TEST", label: "Weekly Test", type: "internal", term: 1, weight: 0 },
    { code: "UNIT_TEST", label: "Unit Test", type: "internal", term: 1, weight: 0 },
    { code: "FA1", label: "Formative Assessment 1 (FA1)", type: "formative", term: 1, weight: 10 },
    { code: "FA2", label: "Formative Assessment 2 (FA2)", type: "formative", term: 1, weight: 10 },
    { code: "SA1", label: "Summative Assessment 1 / Half Yearly", type: "summative", term: 1, weight: 30 },
    { code: "PERIODIC_TEST1", label: "Periodic Test 1", type: "periodic", term: 1, weight: 10 },
    { code: "MID_TERM", label: "Mid Term Exam", type: "summative", term: 1, weight: 30 },
    // Term 2
    { code: "FA3", label: "Formative Assessment 3 (FA3)", type: "formative", term: 2, weight: 10 },
    { code: "FA4", label: "Formative Assessment 4 (FA4)", type: "formative", term: 2, weight: 10 },
    { code: "SA2", label: "Summative Assessment 2 / Annual", type: "summative", term: 2, weight: 30 },
    { code: "PERIODIC_TEST2", label: "Periodic Test 2", type: "periodic", term: 2, weight: 10 },
    { code: "PRE_BOARD", label: "Pre-Board Exam", type: "pre_board", term: 2, weight: 0 },
    { code: "BOARD_EXAM", label: "Board Exam", type: "board", term: 2, weight: 80 },
    // General
    { code: "PRACTICAL", label: "Practical Exam", type: "practical", term: null, weight: 0 },
    { code: "PROJECT", label: "Project / Assignment", type: "project", term: null, weight: 0 },
    { code: "NOTEBOOK", label: "Notebook / Homework", type: "internal", term: null, weight: 0 },
    { code: "ENRICHMENT", label: "Subject Enrichment Activity", type: "internal", term: null, weight: 0 },
    { code: "ANNUAL", label: "Annual Exam", type: "summative", term: 2, weight: 100 },
    { code: "SKILL_OBS", label: "Skill Observation", type: "skill", term: null, weight: 0 },
];

const MARKING_SCHEME_TEMPLATES = {

    // ──────────────────────────────────────────────────
    // PRE-PRIMARY: Playgroup, Nursery, LKG, UKG
    // Skill-based observation — no marks
    // ──────────────────────────────────────────────────
    CBSE_PRE_PRIMARY: {
        scheme_name: "CBSE Pre-Primary (PG–UKG)",
        description: "Skill-based observation grading for Pre-Primary classes. No numerical marks.",
        stage: "PRE_PRIMARY",
        applicable_classes: ["PG", "Nursery", "LKG", "UKG"],
        evaluation_mode: "SKILL_BASED",
        components: [
            { component_id: "PP_COMM", name: "Communication Skills", type: "skill", max_marks: 4, is_grade_only: true },
            { component_id: "PP_MOTOR", name: "Motor Skills", type: "skill", max_marks: 4, is_grade_only: true },
            { component_id: "PP_SOCIAL", name: "Social Behaviour", type: "skill", max_marks: 4, is_grade_only: true },
            { component_id: "PP_CREATIVE", name: "Creativity", type: "skill", max_marks: 4, is_grade_only: true },
            { component_id: "PP_LISTEN", name: "Listening & Speaking", type: "skill", max_marks: 4, is_grade_only: true },
        ],
        grading: {
            pass_marks: null,
            pass_percentage: null,
            display_marks: false,
            grades: [
                { grade: "A", label: "Excellent", min: 4, max: 4 },
                { grade: "B", label: "Good", min: 3, max: 3 },
                { grade: "C", label: "Satisfactory", min: 2, max: 2 },
                { grade: "D", label: "Needs Improvement", min: 1, max: 1 },
            ]
        },
        exam_types_allowed: ["SKILL_OBS"],
    },

    // ──────────────────────────────────────────────────
    // PRIMARY: Class 1–5
    // 5-point grade scale, no numerical marks shown
    // ──────────────────────────────────────────────────
    CBSE_PRIMARY: {
        scheme_name: "CBSE Primary (Class 1–5)",
        description: "Grade-only assessment for Class 1–5. Continuous class tests with 5-point grade scale.",
        stage: "PRIMARY",
        applicable_classes: ["1", "2", "3", "4", "5"],
        evaluation_mode: "GRADE_BASED",
        components: [
            { component_id: "PRI_ORAL", name: "Oral / Class Participation", type: "internal", weight: 20, max_marks: 20 },
            { component_id: "PRI_NOTEBOOK", name: "Notebook / Homework", type: "internal", weight: 10, max_marks: 10 },
            { component_id: "PRI_UT", name: "Unit Test", type: "unit_test", weight: 20, max_marks: 20 },
            { component_id: "PRI_TERM1", name: "Term 1 Exam", type: "summative", weight: 25, max_marks: 25 },
            { component_id: "PRI_TERM2", name: "Term 2 / Annual Exam", type: "summative", weight: 25, max_marks: 25 },
        ],
        grading: {
            pass_marks: null,
            pass_percentage: null,
            display_marks: false,
            grades: [
                { grade: "A*", label: "Outstanding", min: 90, max: 100 },
                { grade: "A", label: "Excellent", min: 75, max: 89 },
                { grade: "B", label: "Very Good", min: 56, max: 74 },
                { grade: "C", label: "Good", min: 35, max: 55 },
                { grade: "D", label: "Needs Improvement", min: 0, max: 34 },
            ]
        },
        exam_types_allowed: ["UNIT_TEST", "WEEKLY_TEST", "MID_TERM", "ANNUAL", "SKILL_OBS", "NOTEBOOK"],
    },

    // ──────────────────────────────────────────────────
    // MIDDLE: Class 6–8
    // 7-point grade, FA+SA system, pass = 33%
    // ──────────────────────────────────────────────────
    CBSE_MIDDLE: {
        scheme_name: "CBSE Middle School (Class 6–8)",
        description: "FA/SA based assessment for Class 6–8. Supports both CCE and Modern CBSE modes.",
        stage: "MIDDLE",
        applicable_classes: ["6", "7", "8"],
        evaluation_mode: "CCE",  // or "MODERN_CBSE"
        // CCE Mode components
        components: [
            // Term 1
            { component_id: "MID_FA1", name: "FA1 — Formative Assessment 1", type: "formative", weight: 10, max_marks: 20, exam_code: "FA1", term: 1 },
            { component_id: "MID_FA2", name: "FA2 — Formative Assessment 2", type: "formative", weight: 10, max_marks: 20, exam_code: "FA2", term: 1 },
            {
                component_id: "MID_SA1", name: "SA1 — Half Yearly Exam", type: "summative", weight: 30, max_marks: 80, exam_code: "SA1", term: 1, sub_components: [
                    { name: "Written", max_marks: 80 },
                    { name: "Oral/Project", max_marks: 20 }
                ]
            },
            // Term 2
            { component_id: "MID_FA3", name: "FA3 — Formative Assessment 3", type: "formative", weight: 10, max_marks: 20, exam_code: "FA3", term: 2 },
            { component_id: "MID_FA4", name: "FA4 — Formative Assessment 4", type: "formative", weight: 10, max_marks: 20, exam_code: "FA4", term: 2 },
            {
                component_id: "MID_SA2", name: "SA2 — Annual Exam", type: "summative", weight: 30, max_marks: 80, exam_code: "SA2", term: 2, sub_components: [
                    { name: "Written", max_marks: 80 },
                    { name: "Oral/Project", max_marks: 20 }
                ]
            },
        ],
        // Modern CBSE alternative
        modern_components: [
            { component_id: "MOD_PT", name: "Periodic Tests (Best 2 of 3)", type: "periodic", weight: 10, max_marks: 10 },
            { component_id: "MOD_NB", name: "Notebook Submission", type: "internal", weight: 5, max_marks: 5 },
            { component_id: "MOD_ENRICH", name: "Subject Enrichment Activity", type: "internal", weight: 5, max_marks: 5 },
            { component_id: "MOD_FINAL", name: "Annual Exam", type: "summative", weight: 80, max_marks: 80 },
        ],
        grading: {
            pass_marks: 33,
            pass_percentage: 33,
            display_marks: true,
            grades: [
                { grade: "A1", label: "Outstanding", min: 90, max: 100, grade_point: 10 },
                { grade: "A2", label: "Excellent", min: 80, max: 89, grade_point: 9 },
                { grade: "B1", label: "Very Good", min: 70, max: 79, grade_point: 8 },
                { grade: "B2", label: "Good", min: 60, max: 69, grade_point: 7 },
                { grade: "C1", label: "Fair", min: 50, max: 59, grade_point: 6 },
                { grade: "C2", label: "Average", min: 40, max: 49, grade_point: 5 },
                { grade: "D", label: "Pass", min: 33, max: 39, grade_point: 4 },
                { grade: "E", label: "Fail", min: 0, max: 32, grade_point: 0 },
            ]
        },
        exam_types_allowed: ["FA1", "FA2", "SA1", "FA3", "FA4", "SA2", "UNIT_TEST", "WEEKLY_TEST", "PERIODIC_TEST1", "PERIODIC_TEST2", "NOTEBOOK", "ENRICHMENT"],
    },

    // ──────────────────────────────────────────────────
    // SECONDARY: Class 9–10
    // 9-point grade, board style, pass = 33% per subject
    // ──────────────────────────────────────────────────
    CBSE_SECONDARY: {
        scheme_name: "CBSE Secondary (Class 9–10)",
        description: "Board-style 9-point grading for Class 9–10. Theory + Internal assessment. Pass = 33% per component.",
        stage: "SECONDARY",
        applicable_classes: ["9", "10"],
        evaluation_mode: "MODERN_CBSE",
        components: [
            { component_id: "SEC_PT", name: "Periodic Tests (Best 2/3 avg)", type: "periodic", weight: 10, max_marks: 30, normalized_to: 10, term: null },
            { component_id: "SEC_NB", name: "Notebook Submission", type: "internal", weight: 5, max_marks: 5, term: null },
            { component_id: "SEC_ENRICH", name: "Subject Enrichment Activity", type: "internal", weight: 5, max_marks: 5, term: null },
            { component_id: "SEC_THEORY", name: "Board / Annual Theory Exam", type: "summative", weight: 80, max_marks: 80, pass_marks: 26, term: 2 },
        ],
        // Also expose FA/SA mode for schools that prefer it
        cce_components: [
            { component_id: "SEC_FA1", name: "FA1", type: "formative", weight: 10, max_marks: 20, exam_code: "FA1", term: 1 },
            { component_id: "SEC_FA2", name: "FA2", type: "formative", weight: 10, max_marks: 20, exam_code: "FA2", term: 1 },
            { component_id: "SEC_SA1", name: "SA1 — Half Yearly", type: "summative", weight: 30, max_marks: 80, exam_code: "SA1", term: 1 },
            { component_id: "SEC_FA3", name: "FA3", type: "formative", weight: 10, max_marks: 20, exam_code: "FA3", term: 2 },
            { component_id: "SEC_FA4", name: "FA4", type: "formative", weight: 10, max_marks: 20, exam_code: "FA4", term: 2 },
            { component_id: "SEC_SA2", name: "SA2 — Annual", type: "summative", weight: 30, max_marks: 80, exam_code: "SA2", term: 2 },
        ],
        grading: {
            pass_marks: 33,
            pass_percentage: 33,
            display_marks: true,
            board_exam: true,
            grades: [
                { grade: "A1", label: "Outstanding", min: 91, max: 100, grade_point: 10 },
                { grade: "A2", label: "Excellent", min: 81, max: 90, grade_point: 9 },
                { grade: "B1", label: "Very Good", min: 71, max: 80, grade_point: 8 },
                { grade: "B2", label: "Good", min: 61, max: 70, grade_point: 7 },
                { grade: "C1", label: "Fair", min: 51, max: 60, grade_point: 6 },
                { grade: "C2", label: "Average", min: 41, max: 50, grade_point: 5 },
                { grade: "D", label: "Pass", min: 33, max: 40, grade_point: 4 },
                { grade: "E1", label: "Fail", min: 21, max: 32, grade_point: 0 },
                { grade: "E2", label: "Fail", min: 0, max: 20, grade_point: 0 },
            ]
        },
        exam_types_allowed: ["PERIODIC_TEST1", "PERIODIC_TEST2", "PRE_BOARD", "BOARD_EXAM", "UNIT_TEST", "FA1", "FA2", "SA1", "FA3", "FA4", "SA2", "NOTEBOOK", "ENRICHMENT", "PRACTICAL"],
    },

    // ──────────────────────────────────────────────────
    // SR. SECONDARY: Class 11–12
    // Marks-based, Theory + Internal/Practical, pass = 33%
    // ──────────────────────────────────────────────────
    CBSE_SR_SECONDARY: {
        scheme_name: "CBSE Sr. Secondary (Class 11–12)",
        description: "Marks-based assessment for Class 11–12. Theory 80 + Internal 20 (or Theory 70 + Practical 30). Pass = 33% per component.",
        stage: "SR_SECONDARY",
        applicable_classes: ["11", "12"],
        evaluation_mode: "MARKS_BASED",
        // Default: theory-heavy (humanities/commerce)
        components: [
            { component_id: "SR_THEORY", name: "Theory Exam", type: "summative", weight: 80, max_marks: 80, pass_marks: 26 },
            { component_id: "SR_INTERNAL", name: "Internal Assessment", type: "internal", weight: 20, max_marks: 20, pass_marks: 0 },
        ],
        // Science subjects with practical
        practical_components: [
            { component_id: "SR_THEORY_P", name: "Theory Exam", type: "summative", weight: 70, max_marks: 70, pass_marks: 23 },
            { component_id: "SR_PRACTICAL", name: "Practical", type: "practical", weight: 30, max_marks: 30, pass_marks: 10 },
        ],
        // Sub-components of Internal Assessment
        internal_sub_components: [
            { name: "Periodic Test", max_marks: 10 },
            { name: "Notebook", max_marks: 5 },
            { name: "Subject Enrichment / Project", max_marks: 5 },
        ],
        grading: {
            pass_marks: 33,
            pass_percentage: 33,
            display_marks: true,
            board_exam: true,
            grades: [
                { grade: "A1", label: "Outstanding", min: 91, max: 100, grade_point: 10 },
                { grade: "A2", label: "Excellent", min: 81, max: 90, grade_point: 9 },
                { grade: "B1", label: "Very Good", min: 71, max: 80, grade_point: 8 },
                { grade: "B2", label: "Good", min: 61, max: 70, grade_point: 7 },
                { grade: "C1", label: "Fair", min: 51, max: 60, grade_point: 6 },
                { grade: "C2", label: "Average", min: 41, max: 50, grade_point: 5 },
                { grade: "D", label: "Pass", min: 33, max: 40, grade_point: 4 },
                { grade: "E", label: "Fail", min: 0, max: 32, grade_point: 0 },
            ]
        },
        exam_types_allowed: ["PERIODIC_TEST1", "PERIODIC_TEST2", "UNIT_TEST", "MID_TERM", "PRE_BOARD", "BOARD_EXAM", "PRACTICAL", "PROJECT", "NOTEBOOK", "ANNUAL"],
    },

    // ──────────────────────────────────────────────────
    // Legacy generic templates (keep for backward compat)
    // ──────────────────────────────────────────────────
    ICSE: {
        scheme_name: "ICSE Standard",
        description: "Standard ICSE marking scheme with semester system",
        stage: "ICSE",
        applicable_classes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        evaluation_mode: "MARKS_BASED",
        components: [
            {
                component_id: "ICSE_SEM1", name: "Semester 1", type: "summative", weight: 50, max_marks: 100,
                sub_components: [{ name: "Theory", max_marks: 70 }, { name: "Practical", max_marks: 20 }, { name: "Project", max_marks: 10 }]
            },
            {
                component_id: "ICSE_SEM2", name: "Semester 2", type: "summative", weight: 50, max_marks: 100,
                sub_components: [{ name: "Theory", max_marks: 70 }, { name: "Practical", max_marks: 20 }, { name: "Project", max_marks: 10 }]
            },
        ],
        grading: {
            pass_percentage: 40,
            grades: [
                { grade: "A+", label: "Excellent", min: 90, max: 100 },
                { grade: "A", label: "Very Good", min: 80, max: 89 },
                { grade: "B+", label: "Good", min: 70, max: 79 },
                { grade: "B", label: "Above Average", min: 60, max: 69 },
                { grade: "C", label: "Average", min: 50, max: 59 },
                { grade: "D", label: "Pass", min: 40, max: 49 },
                { grade: "F", label: "Fail", min: 0, max: 39 },
            ]
        },
    },

    STATE_BOARD: {
        scheme_name: "State Board Standard",
        description: "Standard State Board marking scheme with quarterly exams",
        stage: "STATE_BOARD",
        evaluation_mode: "MARKS_BASED",
        components: [
            { component_id: "SB_QUARTERLY", name: "Quarterly Exam", type: "summative", weight: 20, max_marks: 100 },
            { component_id: "SB_HALF", name: "Half Yearly Exam", type: "summative", weight: 30, max_marks: 100 },
            {
                component_id: "SB_ANNUAL", name: "Annual Exam", type: "summative", weight: 50, max_marks: 100,
                sub_components: [{ name: "Written", max_marks: 90 }, { name: "Practical", max_marks: 10 }]
            },
        ],
        grading: {
            pass_percentage: 35,
            grades: [
                { grade: "A+", label: "Outstanding", min: 90, max: 100 },
                { grade: "A", label: "Excellent", min: 75, max: 89 },
                { grade: "B+", label: "Very Good", min: 60, max: 74 },
                { grade: "B", label: "Good", min: 50, max: 59 },
                { grade: "C", label: "Pass", min: 35, max: 49 },
                { grade: "F", label: "Fail", min: 0, max: 34 },
            ]
        },
    },

    CUSTOM: {
        scheme_name: "Custom Scheme",
        description: "Create your own marking scheme from scratch",
        stage: "CUSTOM",
        evaluation_mode: "MARKS_BASED",
        components: [
            { component_id: "CUSTOM_1", name: "Exam 1", type: "summative", weight: 100, max_marks: 100 },
        ],
        grading: {
            pass_percentage: 33,
            grades: [
                { grade: "A", label: "Excellent", min: 80, max: 100 },
                { grade: "B", label: "Good", min: 60, max: 79 },
                { grade: "C", label: "Pass", min: 33, max: 59 },
                { grade: "F", label: "Fail", min: 0, max: 32 },
            ]
        },
    }
};

export { CBSE_EXAM_TYPES };
export default MARKING_SCHEME_TEMPLATES;
