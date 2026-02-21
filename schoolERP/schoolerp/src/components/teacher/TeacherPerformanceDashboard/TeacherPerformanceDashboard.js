import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Award, FileText, Filter, AlertCircle } from 'lucide-react';

export default function TeacherPerformanceDashboard({ profile }) {
  const [stats, setStats] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Dynamic Options from Profile
  const classOptions = profile?.assigned_classes?.map(ac => `${ac.class}-${ac.section}`) || [];
  const subjectOptions = profile?.subjects || [];

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
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-6">
      <div className="max-w-7xl mx-auto sm:px-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 sm:rounded-b-2xl sm:rounded-none rounded-b-3xl shadow-lg p-6 sm:p-8 mb-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 tracking-tight">Performance Analytics</h1>
            <p className="text-indigo-100 text-sm sm:text-base opacity-90">Academic Year 2024-25</p>
          </div>
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500 opacity-20 pointer-events-none"></div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-0 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                <Filter size={18} />
                <span className="font-bold text-sm">Filters</span>
              </div>

              <div className="flex flex-row overflow-x-auto hide-scrollbar w-full gap-2 pb-1 sm:pb-0">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="flex-shrink-0 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Classes</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>

                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="flex-shrink-0 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Exams</option>
                  <option value="MID_TERM_1">Mid Term 1</option>
                  <option value="TERM_1">Term 1</option>
                  <option value="TERM_2">Term 2</option>
                </select>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="flex-shrink-0 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Subjects</option>
                  {subjectOptions.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - Scrollable on Mobile */}
        <div className="px-4 sm:px-0 mb-6 sm:mb-8">
          <div className="flex sm:grid sm:grid-cols-4 gap-4 overflow-x-auto hide-scrollbar pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 min-w-[200px] flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Results</div>
                <div className="p-2 bg-blue-50 rounded-xl"><FileText className="text-blue-500" size={20} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stats.total_results_uploaded}</div>
                <div className="text-xs font-semibold flex items-center gap-1.5 flex-wrap">
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{stats.published_results} Pub</span>
                  <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{stats.unpublished_results} Draft</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 min-w-[200px] flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overall Average</div>
                <div className="p-2 bg-green-50 rounded-xl"><TrendingUp className="text-green-500" size={20} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 mb-1">85.3%</div>
                <div className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp size={12} /> +2.4% vs last term
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 min-w-[200px] flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pass Percentage</div>
                <div className="p-2 bg-purple-50 rounded-xl"><Award className="text-purple-500" size={20} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 mb-1">98.9%</div>
                <div className="text-xs font-semibold text-gray-500">
                  {stats.total_results_uploaded - stats.grade_distribution.F} passed out of {stats.total_results_uploaded}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 min-w-[200px] flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Students</div>
                <div className="p-2 bg-indigo-50 rounded-xl"><Users className="text-indigo-500" size={20} /></div>
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 mb-1">
                  {stats.class_performance.reduce((sum, cls) => sum + cls.total_students, 0)}
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  Across {stats.class_performance.length} sections
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0 mb-4 sm:mb-6">
          {/* Grade Distribution */}
          <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 sm:mb-6">Grade Distribution</h3>
            <div className="-ml-4 sm:ml-0">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={gradeDistData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {gradeDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-4 sm:grid-cols-7 gap-2 text-center overflow-x-auto hide-scrollbar pb-2">
              {gradeDistData.map((grade, idx) => (
                <div key={grade.name} className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] + '15' }}>
                  <div className="text-xl font-black" style={{ color: COLORS[idx % COLORS.length] }}>
                    {grade.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS[idx % COLORS.length] }}>{grade.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 sm:mb-6">Subject Average Performance</h3>
            <div className="-ml-6 sm:ml-0 overflow-x-auto hide-scrollbar">
              <div className="min-w-[400px] h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerfData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="average" fill="#6366f1" name="Average %" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Comparison */}
        <div className="px-4 sm:px-0 mb-6 sm:mb-8">
          <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 sm:mb-6">Exam Performance Comparison</h3>
            <div className="-ml-6 sm:ml-0 overflow-x-auto hide-scrollbar">
              <div className="min-w-[400px] h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={examCompData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="exam" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis yAxisId="left" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="average"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      name="Average %"
                      dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="students"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Students"
                      strokeDasharray="5 5"
                      dot={{ fill: '#10b981', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Class-wise Performance Table/Cards */}
        <div className="px-4 sm:px-0 mb-6 sm:mb-8">
          <div className="bg-transparent sm:bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 overflow-hidden">
            <div className="sm:p-6 mb-4 sm:mb-0 sm:border-b sm:border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Class Summary</h3>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Avg %</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Pass Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {classPassData.map((cls) => (
                    <tr key={cls.class} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{cls.class}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-700 bg-gray-100 inline-block px-3 py-1 rounded-full">{cls.students}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-indigo-600">{cls.average}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${cls.passRate >= 95 ? 'bg-green-100 text-green-800' :
                          cls.passRate >= 90 ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                          {cls.passRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-1000 ${cls.average >= 85 ? 'bg-green-500' :
                              cls.average >= 75 ? 'bg-blue-500' :
                                cls.average >= 60 ? 'bg-amber-500' : 'bg-red-500'
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

            {/* Mobile Card View */}
            <div className="sm:hidden flex flex-col gap-3">
              {classPassData.map((cls) => (
                <div key={cls.class} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl">Class {cls.class}</div>
                      <div className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Users size={12} />{cls.students}</div>
                    </div>
                    <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-lg ${cls.passRate >= 95 ? 'bg-green-50 text-green-700 border border-green-100' :
                      cls.passRate >= 90 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                      Pass {cls.passRate}%
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      <span>Performance</span>
                      <span className="text-indigo-600">{cls.average}% Avg</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${cls.average >= 85 ? 'bg-green-500' :
                          cls.average >= 75 ? 'bg-blue-500' :
                            cls.average >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${cls.average}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-0">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={16} /></div>
              <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-xs">Strengths</h4>
            </div>
            <ul className="text-sm font-medium text-emerald-700 space-y-2">
              <li className="flex items-start gap-1"><span className="text-emerald-400 mt-0.5">•</span> Biology has highest average (88.2%)</li>
              <li className="flex items-start gap-1"><span className="text-emerald-400 mt-0.5">•</span> Class 10-A performing exceptionally (86.5%)</li>
              <li className="flex items-start gap-1"><span className="text-emerald-400 mt-0.5">•</span> 98.9% overall pass rate</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Award size={16} /></div>
              <h4 className="font-bold text-blue-800 uppercase tracking-wider text-xs">Highlights</h4>
            </div>
            <ul className="text-sm font-medium text-blue-700 space-y-2">
              <li className="flex items-start gap-1"><span className="text-blue-400 mt-0.5">•</span> 45 students achieved A+ grade</li>
              <li className="flex items-start gap-1"><span className="text-blue-400 mt-0.5">•</span> Term 2 shows improvement (86.5%)</li>
              <li className="flex items-start gap-1"><span className="text-blue-400 mt-0.5">•</span> 150 results published successfully</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600"><AlertCircle size={16} /></div>
              <h4 className="font-bold text-amber-800 uppercase tracking-wider text-xs">Focus Areas</h4>
            </div>
            <ul className="text-sm font-medium text-amber-700 space-y-2">
              <li className="flex items-start gap-1"><span className="text-amber-400 mt-0.5">•</span> Physics needs attention (82.3%)</li>
              <li className="flex items-start gap-1"><span className="text-amber-400 mt-0.5">•</span> 2 students failed - need support</li>
              <li className="flex items-start gap-1"><span className="text-amber-400 mt-0.5">•</span> 30 draft results pending publication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}