import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, Book, Target } from 'lucide-react';

export default function StudentResultsDashboard() {
  const admissionNo = "STU001"; // Get from auth context
  const [analytics, setAnalytics] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    // Simulated analytics data
    const mockAnalytics = {
      overall: {
        total_exams: 3,
        average_percentage: 85.5,
        average_grade: 'A',
        total_subjects: 6
      },
      subjects: [
        {
          subject: 'Mathematics',
          exams: [
            { exam_id: 'MID_TERM_1', percentage: 89.17, grade: 'A', total_obtained: 107, total_max: 120 },
            { exam_id: 'TERM_1', percentage: 85.5, grade: 'A', total_obtained: 102, total_max: 120 },
            { exam_id: 'TERM_2', percentage: 91.2, grade: 'A+', total_obtained: 109, total_max: 120 }
          ],
          average_percentage: 88.62,
          highest: 91.2,
          lowest: 85.5,
          trend: 'improving'
        },
        {
          subject: 'Physics',
          exams: [
            { exam_id: 'MID_TERM_1', percentage: 82.5, grade: 'A', total_obtained: 99, total_max: 120 },
            { exam_id: 'TERM_1', percentage: 80.0, grade: 'B+', total_obtained: 96, total_max: 120 },
            { exam_id: 'TERM_2', percentage: 84.17, grade: 'A', total_obtained: 101, total_max: 120 }
          ],
          average_percentage: 82.22,
          highest: 84.17,
          lowest: 80.0,
          trend: 'improving'
        },
        {
          subject: 'Chemistry',
          exams: [
            { exam_id: 'MID_TERM_1', percentage: 87.5, grade: 'A', total_obtained: 105, total_max: 120 },
            { exam_id: 'TERM_1', percentage: 86.67, grade: 'A', total_obtained: 104, total_max: 120 },
            { exam_id: 'TERM_2', percentage: 85.0, grade: 'A', total_obtained: 102, total_max: 120 }
          ],
          average_percentage: 86.39,
          highest: 87.5,
          lowest: 85.0,
          trend: 'declining'
        },
        {
          subject: 'Biology',
          exams: [
            { exam_id: 'MID_TERM_1', percentage: 90.0, grade: 'A+', total_obtained: 108, total_max: 120 },
            { exam_id: 'TERM_1', percentage: 88.33, grade: 'A', total_obtained: 106, total_max: 120 },
            { exam_id: 'TERM_2', percentage: 89.17, grade: 'A', total_obtained: 107, total_max: 120 }
          ],
          average_percentage: 89.17,
          highest: 90.0,
          lowest: 88.33,
          trend: 'stable'
        },
        {
          subject: 'English',
          exams: [
            { exam_id: 'MID_TERM_1', percentage: 78.33, grade: 'B+', total_obtained: 94, total_max: 120 },
            { exam_id: 'TERM_1', percentage: 81.67, grade: 'A', total_obtained: 98, total_max: 120 },
            { exam_id: 'TERM_2', percentage: 83.33, grade: 'A', total_obtained: 100, total_max: 120 }
          ],
          average_percentage: 81.11,
          highest: 83.33,
          lowest: 78.33,
          trend: 'improving'
        },
        {
          subject: 'Computer Science',
          exams: [
            { exam_id: 'MID_TERM_1', percentage: 92.5, grade: 'A+', total_obtained: 111, total_max: 120 },
            { exam_id: 'TERM_1', percentage: 90.83, grade: 'A+', total_obtained: 109, total_max: 120 },
            { exam_id: 'TERM_2', percentage: 93.33, grade: 'A+', total_obtained: 112, total_max: 120 }
          ],
          average_percentage: 92.22,
          highest: 93.33,
          lowest: 90.83,
          trend: 'stable'
        }
      ],
      exams: [
        { exam_id: 'MID_TERM_1', total_percentage: 86.67, subjects_appeared: 6, subjects_passed: 6 },
        { exam_id: 'TERM_1', total_percentage: 85.5, subjects_appeared: 6, subjects_passed: 6 },
        { exam_id: 'TERM_2', total_percentage: 87.7, subjects_appeared: 6, subjects_passed: 6 }
      ]
    };

    setAnalytics(mockAnalytics);
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="text-green-600" size={20} />;
      case 'declining': return <TrendingDown className="text-red-600" size={20} />;
      default: return <Minus className="text-gray-600" size={20} />;
    }
  };

  const getGradeColor = (grade) => {
    if (grade.includes('A')) return 'text-green-600 bg-green-100';
    if (grade.includes('B')) return 'text-blue-600 bg-blue-100';
    if (grade.includes('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.includes('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Prepare data for exam-wise performance graph
  const examWiseData = analytics?.exams.map(exam => ({
    exam: exam.exam_id.replace('_', ' '),
    percentage: exam.total_percentage,
    passed: exam.subjects_passed,
    appeared: exam.subjects_appeared
  })) || [];

  // Prepare data for subject comparison
  const subjectComparisonData = analytics?.subjects.map(sub => ({
    subject: sub.subject,
    average: sub.average_percentage,
    highest: sub.highest,
    lowest: sub.lowest
  })) || [];

  // Prepare radar chart data
  const radarData = analytics?.subjects.map(sub => ({
    subject: sub.subject.length > 10 ? sub.subject.substring(0, 10) + '...' : sub.subject,
    score: sub.average_percentage
  })) || [];

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Academic Performance Dashboard</h1>
          <p className="text-blue-100">Student ID: {admissionNo}</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Overall Average</div>
              <Award className="text-yellow-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{analytics.overall.average_percentage}%</div>
            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(analytics.overall.average_grade)}`}>
              Grade: {analytics.overall.average_grade}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Exams</div>
              <Book className="text-blue-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{analytics.overall.total_exams}</div>
            <div className="text-sm text-gray-500 mt-2">Appeared</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Subjects</div>
              <Target className="text-green-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{analytics.overall.total_subjects}</div>
            <div className="text-sm text-gray-500 mt-2">All Passed</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Best Subject</div>
              <TrendingUp className="text-purple-500" size={24} />
            </div>
            <div className="text-xl font-bold text-gray-800">
              {analytics.subjects.reduce((best, sub) => sub.average_percentage > best.average_percentage ? sub : best).subject}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {Math.max(...analytics.subjects.map(s => s.average_percentage)).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-6 py-3 font-medium ${
                selectedView === 'overview' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('subjects')}
              className={`px-6 py-3 font-medium ${
                selectedView === 'subjects' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Subject-wise Analysis
            </button>
            <button
              onClick={() => setSelectedView('comparison')}
              className={`px-6 py-3 font-medium ${
                selectedView === 'comparison' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Performance Comparison
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Exam-wise Performance Line Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Exam-wise Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={examWiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="exam" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Performance Radar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Subject Performance Radar</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {selectedView === 'subjects' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.subjects.map(subject => (
                <div 
                  key={subject.subject}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800">{subject.subject}</h4>
                    {getTrendIcon(subject.trend)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium">{subject.average_percentage.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Highest:</span>
                      <span className="font-medium text-green-600">{subject.highest}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lowest:</span>
                      <span className="font-medium text-red-600">{subject.lowest}%</span>
                    </div>
                  </div>

                  {/* Mini progress bars */}
                  <div className="mt-4 space-y-1">
                    {subject.exams.map(exam => (
                      <div key={exam.exam_id} className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 w-20">{exam.exam_id.split('_').slice(-1)[0]}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${exam.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs font-medium w-12">{exam.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Subject View */}
            {selectedSubject && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedSubject.subject} - Detailed Analysis</h3>
                  <button 
                    onClick={() => setSelectedSubject(null)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selectedSubject.exams.map(e => ({
                    exam: e.exam_id.replace('_', ' '),
                    percentage: e.percentage,
                    obtained: e.total_obtained,
                    max: e.total_max
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="exam" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Exam</th>
                        <th className="px-4 py-2 text-center">Marks</th>
                        <th className="px-4 py-2 text-center">Percentage</th>
                        <th className="px-4 py-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSubject.exams.map(exam => (
                        <tr key={exam.exam_id}>
                          <td className="px-4 py-2">{exam.exam_id.replace('_', ' ')}</td>
                          <td className="px-4 py-2 text-center">{exam.total_obtained}/{exam.total_max}</td>
                          <td className="px-4 py-2 text-center font-medium">{exam.percentage}%</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(exam.grade)}`}>
                              {exam.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Tab */}
        {selectedView === 'comparison' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Subject Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={subjectComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#3b82f6" name="Average" />
                <Bar dataKey="highest" fill="#10b981" name="Highest" />
                <Bar dataKey="lowest" fill="#ef4444" name="Lowest" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}