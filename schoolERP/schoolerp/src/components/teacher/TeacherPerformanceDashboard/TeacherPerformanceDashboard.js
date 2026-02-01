import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Award, FileText, Filter } from 'lucide-react';

export default function TeacherPerformanceDashboard() {
  const [stats, setStats] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    loadStats();
  }, [selectedClass, selectedExam, selectedSubject]);

  const loadStats = () => {
    // Simulated stats data
    const mockStats = {
      total_results_uploaded: 180,
      published_results: 150,
      unpublished_results: 30,
      
      subjects: {
        'Mathematics': { count: 45, avg_percentage: 85.5 },
        'Physics': { count: 45, avg_percentage: 82.3 },
        'Chemistry': { count: 45, avg_percentage: 86.7 },
        'Biology': { count: 45, avg_percentage: 88.2 }
      },
      
      exams: {
        'MID_TERM_1': { count: 60, avg_percentage: 84.2 },
        'TERM_1': { count: 60, avg_percentage: 83.8 },
        'TERM_2': { count: 60, avg_percentage: 86.5 }
      },
      
      grade_distribution: {
        'A+': 45,
        'A': 60,
        'B+': 35,
        'B': 25,
        'C': 10,
        'D': 3,
        'F': 2
      },
      
      class_performance: [
        { class: '10', section: 'A', avg_percentage: 86.5, total_students: 45 },
        { class: '10', section: 'B', avg_percentage: 84.2, total_students: 45 },
        { class: '11', section: 'A', avg_percentage: 83.8, total_students: 42 },
        { class: '11', section: 'B', avg_percentage: 85.1, total_students: 48 }
      ]
    };

    setStats(mockStats);
  };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

  // Prepare data for grade distribution pie chart
  const gradeDistData = stats ? Object.entries(stats.grade_distribution).map(([grade, count]) => ({
    name: grade,
    value: count
  })) : [];

  // Prepare data for subject performance
  const subjectPerfData = stats ? Object.entries(stats.subjects).map(([subject, data]) => ({
    subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
    average: data.avg_percentage,
    count: data.count
  })) : [];

  // Prepare data for exam comparison
  const examCompData = stats ? Object.entries(stats.exams).map(([exam, data]) => ({
    exam: exam.replace('_', ' '),
    average: data.avg_percentage,
    students: data.count
  })) : [];

  // Calculate pass percentage for each class
  const classPassData = stats?.class_performance.map(cls => ({
    class: `${cls.class}-${cls.section}`,
    average: cls.avg_percentage,
    students: cls.total_students,
    passRate: cls.avg_percentage >= 60 ? 95 : 80 // Simulated
  })) || [];

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Class Performance Analytics</h1>
          <p className="text-indigo-100">Teacher Dashboard - Academic Year 2024-25</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="10-A">Class 10-A</option>
              <option value="10-B">Class 10-B</option>
              <option value="11-A">Class 11-A</option>
              <option value="11-B">Class 11-B</option>
            </select>

            <select 
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Exams</option>
              <option value="MID_TERM_1">Mid Term 1</option>
              <option value="TERM_1">Term 1</option>
              <option value="TERM_2">Term 2</option>
            </select>

            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Results</div>
              <FileText className="text-blue-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.total_results_uploaded}</div>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">{stats.published_results} Published</span>
              <span className="text-gray-400 mx-1">•</span>
              <span className="text-orange-600 font-medium">{stats.unpublished_results} Draft</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Overall Average</div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">85.3%</div>
            <div className="mt-2 text-sm text-green-600 font-medium">
              ↑ 2.4% from last term
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Pass Percentage</div>
              <Award className="text-purple-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">98.9%</div>
            <div className="mt-2 text-sm text-gray-600">
              {stats.total_results_uploaded - stats.grade_distribution.F} / {stats.total_results_uploaded} passed
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Students</div>
              <Users className="text-indigo-500" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.class_performance.reduce((sum, cls) => sum + cls.total_students, 0)}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Across {stats.class_performance.length} sections
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Grade Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {gradeDistData.map((grade, idx) => (
                <div key={grade.name} className="p-2 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20' }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                    {grade.value}
                  </div>
                  <div className="text-xs text-gray-600">{grade.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Subject-wise Average Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectPerfData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#3b82f6" name="Average %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exam Comparison */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Exam-wise Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={examCompData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="exam" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="average" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Average %"
                dot={{ fill: '#8b5cf6', r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="students" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Students"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Class-wise Performance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Class-wise Performance Summary</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classPassData.map((cls) => (
                  <tr key={cls.class} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Class {cls.class}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{cls.students}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{cls.average}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cls.passRate >= 95 ? 'bg-green-100 text-green-800' :
                        cls.passRate >= 90 ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cls.passRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            cls.average >= 85 ? 'bg-green-600' :
                            cls.average >= 75 ? 'bg-blue-600' :
                            cls.average >= 60 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${cls.average}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <h4 className="font-bold text-green-800">Strengths</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Biology has highest average (88.2%)</li>
              <li>• Class 10-A performing exceptionally (86.5%)</li>
              <li>• 98.9% overall pass rate</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-blue-600" size={20} />
              <h4 className="font-bold text-blue-800">Highlights</h4>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 45 students achieved A+ grade</li>
              <li>• Term 2 shows improvement (86.5%)</li>
              <li>• 150 results published successfully</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-orange-600" size={20} />
              <h4 className="font-bold text-orange-800">Focus Areas</h4>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Physics needs attention (82.3%)</li>
              <li>• 2 students failed - need support</li>
              <li>• 30 draft results pending publication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}