import React from "react";

const ExamView = ({ exams }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Exam Marks</h3>
      {exams && exams.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Subject</th>
              <th className="text-left p-2">Term</th>
              <th className="text-left p-2">Marks</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2">{exam.subject}</td>
                <td className="p-2">{exam.term}</td>
                <td className="p-2">
                  {exam.marks_obtained}/{exam.total_marks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No Records Found</p>
      )}
    </div>
  );
};

export default ExamView;
