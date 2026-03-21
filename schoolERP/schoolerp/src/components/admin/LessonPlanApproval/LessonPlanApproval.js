import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPendingLessonPlans, approveLessonPlan } from '../../../feature/admin/adminSlice';
import { 
  CheckCircle, XCircle, Clock, BookOpen, Calendar, 
  Search, Filter, Eye, User, FileText, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LessonPlanApproval = () => {
  const dispatch = useDispatch();
  const { pendingLessonPlans, loading } = useSelector((state) => state.admin);
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Submitted'); // 'Submitted' | 'Approved' | 'Rejected'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    dispatch(getPendingLessonPlans({ approval_status: statusFilter, limit: 100 }));
  }, [dispatch, statusFilter]);


  const handleAction = (status) => {
    if (!selectedPlan) return;
    dispatch(approveLessonPlan({ 
      id: selectedPlan._id, 
      status, 
      comment: remarks, 
      adminId: user?.id || user?.teacher_id || "ADMIN-001" 
    }));
    setSelectedPlan(null);
    setRemarks('');
  };

  // Filter plans based on search and status
  // Note: Backend might only return Submitted if we pass status to getPendingLessonPlans, 
  // but let's filter what we have locally for now.
  const filteredPlans = pendingLessonPlans?.data?.filter(plan => {
    const matchesSearch = 
      plan.topic?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      plan.teacher_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.class_id?.class_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' ? true : plan.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lesson Plan Approvals</h1>
          <p className="text-gray-500 mt-1">Review and manage teacher curriculum submissions</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          <div className="relative flex items-center border border-gray-200 rounded-xl px-3 bg-white">
             <Filter size={16} className="text-gray-400 mr-2" />
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="py-2 bg-transparent outline-none text-sm text-gray-700 cursor-pointer appearance-none pr-6"
             >
               <option value="Submitted">Pending Review</option>
               <option value="Approved">Approved</option>
               <option value="Rejected">Rejected</option>
               <option value="All">All Plans</option>
             </select>
             <ChevronDown size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && (!pendingLessonPlans?.data || pendingLessonPlans.data.length === 0) ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={48} className="mx-auto mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500">No {statusFilter.toLowerCase()} lesson plans match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                  <th className="p-4 pl-6">Topic / Date</th>
                  <th className="p-4">Teacher</th>
                  <th className="p-4">Class & Subject</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-semibold text-gray-900">{plan.topic}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar size={12} className="mr-1" /> {new Date(plan.planned_date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                          {plan.teacher_id?.name ? plan.teacher_id.name.substring(0,2).toUpperCase() : 'T'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{plan.teacher_id?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {plan.class_id?.class_name || plan.class_id || ''}-{plan.section}
                      </span>
                      {plan.subject_id && <span className="text-xs text-gray-500 ml-2">{plan.subject_id?.subject_name || 'Subject'}</span>}
                      {plan.admin_remarks && (
                        <p className="text-[10px] text-gray-500 italic mt-1 truncate max-w-[200px]" title={plan.admin_remarks}>
                          Note: {plan.admin_remarks}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                       {plan.approval_status === 'Submitted' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1"/> Pending</span>}
                       {plan.approval_status === 'Approved' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Approved</span>}
                       {plan.approval_status === 'Rejected' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1"/> Rejected</span>}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button 
                        onClick={() => setSelectedPlan(plan)}
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={16} className="mr-1.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <BookOpen size={20} className="mr-2 text-indigo-600"/>
                  Review Lesson Plan
                </h2>
                <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedPlan.topic}</h3>
                    <p className="text-sm text-gray-500 flex items-center"><Calendar size={14} className="mr-1.5"/> Planned for: <strong className="ml-1 text-gray-700">{new Date(selectedPlan.planned_date).toLocaleDateString()}</strong></p>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <span className="text-sm text-gray-500 mb-1">Submitted by</span>
                    <div className="flex items-center text-gray-900 font-medium">
                      <User size={16} className="mr-1.5 text-gray-400"/>
                      {selectedPlan.teacher_id?.name || 'Teacher'}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Objectives</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedPlan.objectives || 'No objectives specified.'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100/50">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Teaching Method</h4>
                      <p className="text-indigo-900 text-sm">{selectedPlan.teaching_method || 'Standard'}</p>
                    </div>
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Class Coverage</h4>
                      <p className="text-blue-900 text-sm font-medium">
                        {selectedPlan.class_id?.class_name || selectedPlan.class_id}-{selectedPlan.section} 
                        <span className="mx-2 opacity-50">•</span> 
                        {selectedPlan.subject_id?.subject_name || 'Subject'}
                      </p>
                    </div>
                  </div>

                  {selectedPlan.resources?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 tracking-wider">Attached Resources ({selectedPlan.resources.length})</h4>
                      <div className="flex flex-col gap-2">
                        {selectedPlan.resources.map((res, i) => (
                           <div key={i} className="flex items-center p-3 rounded-lg border border-gray-200 bg-white">
                             <FileText size={16} className="text-gray-400 mr-3" />
                             <span className="text-sm font-medium text-gray-700">{res.split('/').pop()}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit Trail (Optional) */}
                  {selectedPlan.audit_trail?.length > 0 && (
                     <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">History</h4>
                        <div className="space-y-3">
                          {selectedPlan.audit_trail.map((audit, i) => (
                             <div key={i} className="flex text-xs text-gray-500">
                               <span className="w-24 shrink-0">{new Date(audit.timestamp).toLocaleDateString()}</span>
                               <span><strong className="text-gray-700">{audit.modified_by_model}</strong> changed status to <strong className="text-gray-700">{audit.action}</strong></span>
                             </div>
                          ))}
                        </div>
                     </div>
                  )}
                </div>
              </div>

              {selectedPlan.approval_status === 'Submitted' ? (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Remarks / Feedback</label>
                  <textarea 
                    rows={2} 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none mb-4" 
                    placeholder="Add feedback for the teacher (required for rejection)..." 
                  />
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => handleAction('Rejected')}
                      disabled={!remarks.trim()}
                      className="px-5 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!remarks.trim() ? "A note is required for rejection" : ""}
                    >
                      Reject Submission
                    </button>
                    <button 
                      onClick={() => handleAction('Approved')}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-sm transition-colors"
                    >
                      Approve Lesson Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
                  This lesson plan was {selectedPlan.approval_status.toLowerCase()}. No further action required.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonPlanApproval;
