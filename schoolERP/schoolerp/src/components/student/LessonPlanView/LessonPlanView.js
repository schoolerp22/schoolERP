import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentLessonPlans } from '../../../feature/students/studentSlice';
import { BookOpen, Calendar, Clock, Download, FileText, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentLessonPlanView = () => {
  const dispatch = useDispatch();
  const { studentLessonPlans, loading, currentStudent } = useSelector((state) => state.student);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (currentStudent?.id) {
       dispatch(getStudentLessonPlans({ studentId: currentStudent.id }));
    }
  }, [dispatch, currentStudent]);

  // Derived unique subjects for filtering
  const subjects = ['All', ...new Set(studentLessonPlans?.map(plan => plan.subject_id?.subject_name || 'General'))];

  const filteredPlans = studentLessonPlans?.filter(plan => {
    const matchesSearch = plan.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'All' ? true : (plan.subject_id?.subject_name || 'General') === subjectFilter;
    return matchesSearch && matchesSubject;
  }).sort((a, b) => new Date(b.planned_date) - new Date(a.planned_date)) || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
             <BookOpen className="mr-3 text-indigo-600" /> Lesson Plans
          </h1>
          <p className="text-gray-500 mt-1">Track what's being taught in your classes</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden">
             <select 
               value={subjectFilter} 
               onChange={(e) => setSubjectFilter(e.target.value)}
               className="py-2 pl-4 pr-10 bg-transparent outline-none text-sm text-gray-700 cursor-pointer appearance-none w-full"
             >
               {subjects.map(subj => (
                 <option key={subj} value={subj}>{subj}</option>
               ))}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Lesson Plans Available</h3>
          <p className="text-gray-500 mt-2">There are no approved lesson plans matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline View (Left/Main Column) */}
          <div className="lg:col-span-2 space-y-4">
             {filteredPlans.map((plan, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={plan._id} 
                  className={`bg-white border rounded-2xl p-5 shadow-sm transition-all cursor-pointer ${selectedPlan?._id === plan._id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2 border border-gray-200 rounded-full pr-3 pl-1 py-1 bg-gray-50">
                       <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                         {plan.teacher_id?.name ? plan.teacher_id.name.substring(0,2).toUpperCase() : 'T'}
                       </div>
                       <span className="text-xs font-medium text-gray-700">{plan.teacher_id?.name || 'Teacher'}</span>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {plan.status === 'Completed' ? <CheckCircle size={12} className="mr-1"/> : <Clock size={12} className="mr-1"/>}
                      {plan.status || 'Upcoming'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{plan.topic}</h3>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2 mb-4">
                     <span className="flex items-center text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                        {plan.subject_id?.subject_name || 'Subject'}
                     </span>
                     <span className="flex items-center">
                        <Calendar size={14} className="mr-1.5" />
                        {new Date(plan.planned_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                     </span>
                     {plan.resources?.length > 0 && (
                       <span className="flex items-center text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                          <FileText size={14} className="mr-1.5" /> {plan.resources.length} Resource(s)
                       </span>
                     )}
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">{plan.objectives}</p>
                </motion.div>
             ))}
          </div>

          {/* Details Sidebar (Right Column) */}
          <div className="lg:col-span-1">
             <div className="sticky top-6">
                <AnimatePresence mode="wait">
                  {selectedPlan ? (
                    <motion.div 
                      key={selectedPlan._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden"
                    >
                      <div className="bg-indigo-50 border-b border-indigo-100 p-5">
                         <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Lesson Details</div>
                         <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedPlan.topic}</h2>
                         <div className="flex items-center text-sm text-gray-600">
                           <Calendar size={14} className="mr-1.5 text-indigo-500" /> {new Date(selectedPlan.planned_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                         </div>
                      </div>
                      
                      <div className="p-5 space-y-6">
                         <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Learning Objectives</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedPlan.objectives}</p>
                         </div>
                         
                         <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Teaching Method</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 inline-block">
                               {selectedPlan.teaching_method || 'Standard class session'}
                            </p>
                         </div>

                         {selectedPlan.resources?.length > 0 && (
                            <div>
                               <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                  Study Materials <span className="ml-2 bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs">{selectedPlan.resources.length}</span>
                               </h4>
                               <div className="space-y-2">
                                  {selectedPlan.resources.map((res, i) => {
                                     const fileName = res.split('/').pop() || `Resource ${i + 1}`;
                                     return (
                                       <a 
                                         key={i} 
                                         href={res} 
                                         target="_blank" 
                                         rel="noreferrer"
                                         className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
                                       >
                                          <div className="flex items-center overflow-hidden">
                                             <FileText size={16} className="text-indigo-500 mr-3 flex-shrink-0" />
                                             <span className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-700">{fileName}</span>
                                          </div>
                                          <Download size={16} className="text-gray-400 group-hover:text-indigo-600 flex-shrink-0 ml-2" />
                                       </a>
                                     );
                                  })}
                               </div>
                            </div>
                         )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center h-64 text-gray-500">
                       <BookOpen size={40} className="text-gray-300 mb-3" />
                       <p className="text-sm">Select a lesson plan from the list to view its complete details and download study materials.</p>
                    </div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLessonPlanView;
