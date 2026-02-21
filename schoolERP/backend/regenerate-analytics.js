import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { updateStudentAnalytics } from "./utils/updateStudentAnalytics.js";

dotenv.config();

async function regenerateAnalytics() {
    try {
        console.log("Connecting to database...");
        const db = await connectDB();

        const admissionNo = "CH135";
        const academicYear = "2024-25";

        console.log(`\n=== Regenerating Analytics for ${admissionNo} ===\n`);

        // Check existing results
        const results = await db.collection("results").find({
            admission_no: admissionNo,
            academic_year: academicYear,
            is_published: true
        }).toArray();

        console.log(`Found ${results.length} published results for ${admissionNo}`);

        if (results.length === 0) {
            console.log("\n❌ No published results found!");
            console.log("Please ensure results are uploaded and published first.");
            process.exit(1);
        }

        console.log("\nPublished results:");
        results.forEach(r => {
            console.log(`  - ${r.subject} (${r.exam_id}): ${r.total_obtained}/${r.total_max} = ${r.percentage}% (${r.grade})`);
        });

        // Regenerate analytics
        console.log("\n=== Calling updateStudentAnalytics ===\n");
        await updateStudentAnalytics(db, [admissionNo], academicYear);

        // Verify analytics were created
        const analytics = await db.collection("student_analytics").findOne({
            admission_no: admissionNo,
            academic_year: academicYear
        });

        if (analytics) {
            console.log("\n✅ Analytics generated successfully!\n");
            console.log("Overall Stats:");
            console.log(`  - Total Exams: ${analytics.overall.total_exams}`);
            console.log(`  - Average Percentage: ${analytics.overall.average_percentage}%`);
            console.log(`  - Average Grade: ${analytics.overall.average_grade}`);
            console.log(`  - Total Subjects: ${analytics.overall.total_subjects}`);

            console.log("\nSubjects:");
            analytics.subjects.forEach(s => {
                console.log(`  - ${s.subject}: ${s.average_percentage}% (${s.exams.length} exams)`);
            });

            console.log("\nExams:");
            analytics.exams.forEach(e => {
                console.log(`  - ${e.exam_id}: ${e.total_percentage}% (${e.subjects_appeared} subjects)`);
            });
        } else {
            console.log("\n❌ Analytics were not created!");
        }

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

regenerateAnalytics();
