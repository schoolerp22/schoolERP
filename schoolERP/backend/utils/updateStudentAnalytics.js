// Utility function to update student analytics
// This should be called whenever results are published/updated/deleted

function calculateTrend(percentages) {
    if (percentages.length < 2) return "stable";

    const recent = percentages.slice(-3);
    if (recent.length < 2) return "stable";

    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < recent.length; i++) {
        if (recent[i] > recent[i - 1]) increasing++;
        else if (recent[i] < recent[i - 1]) decreasing++;
    }

    if (increasing > decreasing) return "improving";
    if (decreasing > increasing) return "declining";
    return "stable";
}

export async function updateStudentAnalytics(db, admissionNos, academicYear) {
    try {
        console.log(`[Analytics] Updating analytics for ${admissionNos.length} students`);

        for (const admissionNo of admissionNos) {
            try {
                const results = await db.collection("results").find({
                    admission_no: admissionNo,
                    academic_year: academicYear,
                    is_published: true
                }).toArray();

                console.log(`[Analytics] Student ${admissionNo}: Found ${results.length} published results`);

                if (results.length === 0) {
                    // Delete analytics if no published results
                    await db.collection("student_analytics").deleteOne({
                        admission_no: admissionNo,
                        academic_year: academicYear
                    });
                    console.log(`[Analytics] Student ${admissionNo}: Deleted analytics (no published results)`);
                    continue;
                }

                // Calculate overall performance
                const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
                const avgPercentage = totalPercentage / results.length;

                // Get unique exams
                const uniqueExams = [...new Set(results.map(r => r.exam_id))];

                // Calculate subject-wise performance
                const subjectMap = {};
                results.forEach(result => {
                    if (!subjectMap[result.subject]) {
                        subjectMap[result.subject] = {
                            subject: result.subject,
                            exams: [],
                            total_percentage: 0,
                            count: 0
                        };
                    }

                    subjectMap[result.subject].exams.push({
                        exam_id: result.exam_id,
                        percentage: result.percentage,
                        grade: result.grade,
                        total_obtained: result.total_obtained,
                        total_max: result.total_max
                    });

                    subjectMap[result.subject].total_percentage += result.percentage;
                    subjectMap[result.subject].count++;
                });

                const subjects = Object.values(subjectMap).map(sub => {
                    const percentages = sub.exams.map(e => e.percentage);
                    return {
                        subject: sub.subject,
                        exams: sub.exams,
                        average_percentage: parseFloat((sub.total_percentage / sub.count).toFixed(2)),
                        highest: Math.max(...percentages),
                        lowest: Math.min(...percentages),
                        trend: calculateTrend(percentages)
                    };
                });

                // Calculate exam-wise performance
                const examMap = {};
                results.forEach(result => {
                    if (!examMap[result.exam_id]) {
                        examMap[result.exam_id] = {
                            exam_id: result.exam_id,
                            subjects: [],
                            total_percentage: 0,
                            total_obtained: 0,
                            total_max: 0,
                            count: 0
                        };
                    }

                    examMap[result.exam_id].subjects.push({
                        subject: result.subject,
                        percentage: result.percentage,
                        grade: result.grade
                    });

                    examMap[result.exam_id].total_percentage += result.percentage;
                    examMap[result.exam_id].total_obtained += result.total_obtained;
                    examMap[result.exam_id].total_max += result.total_max;
                    examMap[result.exam_id].count++;
                });

                const exams = Object.values(examMap).map(exam => ({
                    exam_id: exam.exam_id,
                    total_percentage: parseFloat((exam.total_percentage / exam.count).toFixed(2)),
                    subjects_appeared: exam.count,
                    subjects_passed: exam.subjects.filter(s => s.grade !== 'F').length,
                    aggregate_percentage: parseFloat(((exam.total_obtained / exam.total_max) * 100).toFixed(2))
                }));

                // Get student's grade
                const scheme = await db.collection("marking_schemes").findOne({
                    academic_year: academicYear
                });

                let overallGrade = "N/A";
                if (scheme) {
                    const gradeInfo = scheme.grading.grades.find(
                        g => avgPercentage >= g.min && avgPercentage <= g.max
                    );
                    overallGrade = gradeInfo ? gradeInfo.grade : "N/A";
                }

                // Update or insert analytics
                const updateResult = await db.collection("student_analytics").updateOne(
                    {
                        admission_no: admissionNo,
                        academic_year: academicYear
                    },
                    {
                        $set: {
                            overall: {
                                total_exams: uniqueExams.length,
                                average_percentage: parseFloat(avgPercentage.toFixed(2)),
                                average_grade: overallGrade,
                                total_subjects: Object.keys(subjectMap).length
                            },
                            subjects: subjects,
                            exams: exams,
                            last_updated: new Date()
                        }
                    },
                    { upsert: true }
                );

                console.log(`[Analytics] Student ${admissionNo}: Updated (matched: ${updateResult.matchedCount}, modified: ${updateResult.modifiedCount}, upserted: ${updateResult.upsertedCount})`);
            } catch (studentError) {
                console.error(`[Analytics] Error updating analytics for ${admissionNo}:`, studentError);
            }
        }

        console.log(`[Analytics] Completed analytics update`);
    } catch (error) {
        console.error("[Analytics] Error in updateStudentAnalytics:", error);
    }
}
