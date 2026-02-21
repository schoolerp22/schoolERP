import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, Book, Target } from 'lucide-react';

export default function StudentResultsDashboard({ admissionNo, analytics, results, academicYear, setAcademicYear }) {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSubject, setSelectedSubject] = useState(null);

  // We don't need internal state for analytics anymore, strictly use props
  // If analytics prop is null, show loading


  const getTrendIcon = (trend) => {
    switch (trend) {
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 md:p-8 mb-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Academic Performance</h1>
            <p className="text-blue-100 text-sm md:text-base">Student ID: {admissionNo}</p>
          </div>

          {/* Year Selector */}
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg w-full sm:w-auto flex justify-between sm:justify-start items-center">
            <label className="mr-2 text-sm font-medium">Academic Year:</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-white text-gray-800 rounded px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-white"
            >
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
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
            {analytics.subjects && analytics.subjects.length > 0 ? (
              <>
                <div className="text-xl font-bold text-gray-800">
                  {analytics.subjects.reduce((best, sub) => (sub.average_percentage || 0) > (best.average_percentage || 0) ? sub : best).subject}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {(Math.max(...analytics.subjects.map(s => s.average_percentage || 0)) || 0).toFixed(2)}%
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 mt-2">No data available</div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex overflow-x-auto hide-scrollbar border-b">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-6 py-3 font-medium ${selectedView === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('subjects')}
              className={`px-6 py-3 font-medium ${selectedView === 'subjects'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Subject-wise Analysis
            </button>
            <button
              onClick={() => setSelectedView('comparison')}
              className={`px-6 py-3 font-medium ${selectedView === 'comparison'
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
            <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Exam-wise Performance Trend</h3>
              {examWiseData.length > 0 ? (
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
              ) : (
                <p className="text-gray-500 text-center py-10">No exam data available yet.</p>
              )}
            </div>

            {/* Subject Performance Radar Chart */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Subject Performance Radar</h3>
              {radarData.length > 0 ? (
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
              ) : (
                <p className="text-gray-500 text-center py-10">No subject data available yet.</p>
              )}
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
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer p-5"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 text-lg">{subject.subject}</h4>
                    {getTrendIcon(subject.trend)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium">{(subject.average_percentage || 0).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Highest:</span>
                      <span className="font-medium text-green-600">{subject.highest || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lowest:</span>
                      <span className="font-medium text-red-600">{subject.lowest || 0}%</span>
                    </div>
                  </div>

                  {/* Mini progress bars */}
                  <div className="mt-4 space-y-1">
                    {subject.exams && subject.exams.map(exam => (
                      <div key={exam.exam_id} className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 w-20">{exam.exam_id.split('_').slice(-1)[0]}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${exam.percentage || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs font-medium w-12">{exam.percentage || 0}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Subject View */}
            {selectedSubject && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">{selectedSubject.subject} - Analysis</h3>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="text-gray-500 hover:text-gray-800 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>

                <div className="overflow-x-auto hide-scrollbar">
                  <div style={{ minWidth: '400px' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={selectedSubject.exams.map(e => ({
                        exam: e.exam_id.replace('_', ' '),
                        percentage: e.percentage,
                        obtained: e.total_obtained,
                        max: e.total_max
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="exam" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Subject Comparison</h3>
            <div className="overflow-x-auto hide-scrollbar">
              <div style={{ minWidth: '400px' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={subjectComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="subject" angle={-45} textAnchor="end" height={80} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="average" fill="#3b82f6" name="Average" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="highest" fill="#10b981" name="Highest" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="lowest" fill="#ef4444" name="Lowest" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}