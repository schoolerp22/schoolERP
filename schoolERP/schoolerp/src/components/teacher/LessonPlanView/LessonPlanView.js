import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getLessonPlans, 
  createLessonPlan, 
  updateLessonPlan, 
  deleteLessonPlan, 
  submitLessonPlan, 
  updateLessonExecution 
} from '../../../feature/teachers/teacherSlice';
import { 
  BookOpen, Plus, Calendar as CalendarIcon, List, 
  CheckCircle, XCircle, FileText, X, Edit2, Trash2, Send,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LessonPlanView = ({ selectedClass, teacherId, profile }) => {
  const dispatch = useDispatch();
  const { lessonPlans, loading } = useSelector((state) => state.teacher);
  
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'list'
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    topic: '',
    objectives: '',
    teaching_method: '',
    planned_date: new Date().toISOString().split('T')[0],
    remarks: '',
    assigned_class_index: 0
  });
  const [files, setFiles] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  
  // Calendar state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  const getDaysOfWeek = (start) => {
    const days = [];
    for (let i = 0; i < 6; i++) { // Mon - Sat
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const [weekDays, setWeekDays] = useState(getDaysOfWeek(currentWeekStart));

  useEffect(() => {
    setWeekDays(getDaysOfWeek(currentWeekStart));
  }, [currentWeekStart]);

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const handleDragStart = (e, planId) => {
    e.dataTransfer.setData("planId", planId);
  };

  const handleDrop = async (e, targetDateStr) => {
    e.preventDefault();
    const planId = e.dataTransfer.getData("planId");
    if (!planId) return;

    const planToUpdate = lessonPlans?.data?.find(p => p._id === planId);
    if (!planToUpdate) return;
    
    if (planToUpdate.approval_status === "Approved" || planToUpdate.status === "Completed") {
      alert("Cannot reschedule an approved or completed lesson plan.");
      return;
    }

    const formData = new FormData();
    formData.append('planned_date', targetDateStr);
    formData.append('kept_resources', JSON.stringify(planToUpdate.resources || []));

    await dispatch(updateLessonPlan({ id: planId, formData }));
    dispatch(getLessonPlans({ teacher_id: teacherId, limit: 100 }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Fetch plans when class changes
  useEffect(() => {
    if (teacherId && selectedClass) {
      // Fetch all for the teacher to allow calendar mapping, or filter strictly
      dispatch(getLessonPlans({ teacher_id: teacherId, limit: 100 }));
    }
  }, [teacherId, selectedClass, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('teacher_id', teacherId);
    
    const assigned = profile?.assigned_classes?.[formData.assigned_class_index || 0];
    
    // Fallbacks if Object IDs not strictly enforced yet in DB
    data.append('class_id', assigned?.class_id || assigned?.class || "000000000000000000000000"); 
    data.append('section', assigned?.section || "A");
    data.append('subject_id', assigned?.subject_id || assigned?.subject_name || assigned?.subject || "000000000000000000000000"); 
    
    Object.keys(formData).forEach(key => {
      if (key !== 'assigned_class_index') data.append(key, formData[key]);
    });
    files.forEach(file => data.append('resources', file));

    if (editingPlan) {
      // Put existing resources string back if keeping
      data.append('kept_resources', JSON.stringify(editingPlan.resources || []));
      await dispatch(updateLessonPlan({ id: editingPlan._id, formData: data }));
    } else {
      await dispatch(createLessonPlan(data));
    }
    
    setShowModal(false);
    setEditingPlan(null);
    setFormData({ topic: '', objectives: '', teaching_method: '', planned_date: new Date().toISOString().split('T')[0], remarks: '', assigned_class_index: 0});
    setFiles([]);
    dispatch(getLessonPlans({ teacher_id: teacherId, limit: 100 }));
  };

  const handleSubmitApproval = (id) => {
    dispatch(submitLessonPlan({ id, teacherId }));
    setShowModal(false);
  };

  const handleExecution = (id, status) => {
    dispatch(updateLessonExecution({ id, executionData: { status, teacher_id: teacherId } }));
  };

  const getStatusBadge = (status, approval_status) => {
    if (approval_status === "Draft") return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Draft</span>;
    if (approval_status === "Submitted") return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Pending Approval</span>;
    if (approval_status === "Rejected") return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Rejected</span>;
    
    // If approved, show execution status
    if (status === "Completed") return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>;
    if (status === "Postponed") return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Postponed</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Approved</span>;
  };

  return (
    <div className="space-y-6">
      {/* Approval Notifications */}
      {lessonPlans?.data?.filter(p => !dismissedAlerts.includes(p._id) && (p.approval_status === "Approved" || p.approval_status === "Rejected")).length > 0 && (
        <div className="space-y-3">
          {lessonPlans.data
            .filter(p => !dismissedAlerts.includes(p._id) && (p.approval_status === "Approved" || p.approval_status === "Rejected"))
            .sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 2) // Show only last 2
            .map(plan => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={`alert-${plan._id}`}
                className={`p-4 rounded-xl border flex items-center justify-between group relative ${plan.approval_status === 'Approved' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${plan.approval_status === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {plan.approval_status === 'Approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Lesson Plan {plan.approval_status}: {plan.topic}</h4>
                    {(plan.admin_remarks || plan.remarks) && (
                      <p className="text-xs opacity-80 mt-0.5 text-gray-700">
                        {plan.approval_status === 'Approved' ? 'Feedback: ' : 'Reason: '} 
                        {plan.admin_remarks || plan.remarks}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                    {new Date(plan.updated_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => setDismissedAlerts(prev => [...prev, plan._id])}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          }
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lesson Plans</h1>
          <p className="text-gray-500 mt-1">Manage curriculum and execution for {selectedClass}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`p-2 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={`p-2 rounded-lg transition-colors ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={20} />
            </button>
          </div>
          <button
            onClick={() => { 
              setEditingPlan(null); 
              const defaultIdx = profile?.assigned_classes?.findIndex(c => c.section ? `${c.class}-${c.section}` === selectedClass : `${c.class}` === selectedClass);
              setFormData({
                topic: '',
                objectives: '',
                teaching_method: '',
                planned_date: new Date().toISOString().split('T')[0],
                remarks: '',
                assigned_class_index: Math.max(0, defaultIdx || 0)
              });
              setFiles([]);
              setShowModal(true); 
            }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            <span className="font-medium">New Plan</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeTab === 'list' ? (
          <div className="space-y-4">
            {lessonPlans?.data?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No lesson plans found. Create one to get started!</div>
            ) : (
              lessonPlans?.data?.map((plan) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={plan._id} 
                  className="flex flex-col sm:flex-row justify-between p-5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg text-gray-900">{plan.topic}</h3>
                      {getStatusBadge(plan.status, plan.approval_status)}
                    </div>
                    <p className="text-gray-600 text-sm">{plan.objectives}</p>
                    {plan.admin_remarks && (
                      <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                        <span className="font-bold shrink-0">Admin Feedback:</span>
                        <span>{plan.admin_remarks}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">

                      <span className="flex items-center"><CalendarIcon size={14} className="mr-1"/> {new Date(plan.planned_date).toLocaleDateString()}</span>
                      <span className="flex items-center"><BookOpen size={14} className="mr-1"/> {plan.teaching_method}</span>
                      {plan.resources?.length > 0 && <span className="flex items-center text-indigo-500"><FileText size={14} className="mr-1"/> {plan.resources.length} resources</span>}
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                    {plan.approval_status === "Draft" && (
                      <>
                        <button onClick={() => handleSubmitApproval(plan._id)} title="Submit for Approval" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Send size={18} /></button>
                        <button onClick={() => { 
                          setEditingPlan(plan); 
                          const editIdx = profile?.assigned_classes?.findIndex(c => c.class_id === plan.class_id && c.subject_id === plan.subject_id);
                          setFormData({
                            topic: plan.topic || '',
                            objectives: plan.objectives || '',
                            teaching_method: plan.teaching_method || '',
                            planned_date: plan.planned_date ? new Date(plan.planned_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            remarks: plan.remarks || '',
                            assigned_class_index: Math.max(0, editIdx || 0)
                          });
                          setShowModal(true); 
                        }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => dispatch(deleteLessonPlan(plan._id))} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </>
                    )}
                    {plan.approval_status === "Approved" && plan.status !== "Completed" && (
                       <button onClick={() => handleExecution(plan._id, "Completed")} className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors">
                         <CheckCircle size={16} className="mr-1.5"/> Mark Done
                       </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <CalendarIcon size={20} className="mr-2 text-indigo-600" /> 
                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                {' - '} 
                {weekDays[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h2>
              <div className="flex space-x-2">
                <button onClick={prevWeek} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentWeekStart(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)))} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
                  Today
                </button>
                <button onClick={nextWeek} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-4 flex-1">
              {weekDays.map((day, idx) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayPlans = lessonPlans?.data?.filter(p => new Date(p.planned_date).toISOString().split('T')[0] === dateStr) || [];
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col border rounded-xl overflow-hidden transition-colors ${isToday ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-200 bg-gray-50/30'}`}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    onDragOver={handleDragOver}
                  >
                    <div className={`p-3 text-center border-b font-medium ${isToday ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                      <div className="text-sm">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xl">{day.getDate()}</div>
                    </div>
                    
                    <div className="p-2 flex-1 flex flex-col gap-2 min-h-[300px] overflow-y-auto">
                      {dayPlans.map(plan => (
                        <div 
                          key={plan._id} 
                          draggable={plan.approval_status !== "Approved"}
                          onDragStart={(e) => handleDragStart(e, plan._id)}
                          onClick={() => { 
                            setEditingPlan(plan); 
                            const editIdx = profile?.assigned_classes?.findIndex(c => c.class_id === plan.class_id && c.subject_id === plan.subject_id);
                            setFormData({
                              topic: plan.topic || '',
                              objectives: plan.objectives || '',
                              teaching_method: plan.teaching_method || '',
                              planned_date: plan.planned_date ? new Date(plan.planned_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                              remarks: plan.remarks || '',
                              assigned_class_index: Math.max(0, editIdx || 0)
                            });
                            setShowModal(true); 
                          }}
                          className={`p-3 rounded-lg border shadow-sm cursor-pointer transition-all hover:-translate-y-0.5
                            ${plan.approval_status === 'Approved' ? 'bg-purple-50 border-purple-100' : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-md'}`
                          }
                        >
                          <div className="text-xs font-semibold mb-1 truncate text-gray-800" title={plan.topic}>{plan.topic}</div>
                          <div className="flex justify-between items-center mt-2">
                            {getStatusBadge(plan.status, plan.approval_status)}
                            <div className="flex items-center space-x-1">
                              {plan.approval_status === 'Draft' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleSubmitApproval(plan._id); }} 
                                  title="Submit for Approval" 
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                >
                                  <Send size={14} />
                                </button>
                              )}
                              {plan.resources?.length > 0 && <FileText size={12} className="text-gray-400" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{editingPlan ? 'Edit Lesson Plan' : 'New Lesson Plan'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Class & Section <span className="text-red-500">*</span></label>
                    <div className={`relative border ${editingPlan ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'} rounded-xl overflow-hidden`}>
                      <select 
                        name="assigned_class_index" 
                        value={formData.assigned_class_index} 
                        onChange={handleInputChange} 
                        disabled={!!editingPlan}
                        className={`w-full px-4 py-2.5 bg-transparent outline-none text-sm ${editingPlan ? 'text-gray-500 cursor-not-allowed' : 'text-gray-700 cursor-pointer'} appearance-none`}
                      >
                        {profile?.assigned_classes?.map((c, i) => (
                          <option key={i} value={i}>
                            Class {c.class} {c.section ? `- ${c.section}` : ''} ({c.subject_name || c.subject || 'Subject'})
                          </option>
                        ))}
                      </select>
                      {!editingPlan && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Topic <span className="text-red-500">*</span></label>
                    <input required name="topic" value={formData.topic} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" placeholder="e.g. Algebra Basics" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Planned Date <span className="text-red-500">*</span></label>
                    <input required type="date" name="planned_date" value={formData.planned_date} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Objectives <span className="text-gray-400 font-normal">(What will students learn?)</span></label>
                  <textarea rows={3} name="objectives" value={formData.objectives} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none resize-none" placeholder="Students will be able to solve linear equations..." />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Teaching Methodology</label>
                  <input name="teaching_method" value={formData.teaching_method} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" placeholder="e.g. Interactive Lecture, Group Activity, Lab" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Resources & Attachments</label>
                  <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" />
                  {editingPlan?.resources?.length > 0 && (
                    <p className="text-xs text-indigo-600 mt-2">Currently has {editingPlan.resources.length} attachments</p>
                  )}
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  {editingPlan && editingPlan.approval_status === 'Draft' && (
                    <button type="button" onClick={() => handleSubmitApproval(editingPlan._id)} className="px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-medium transition-colors">
                      Submit for Approval
                    </button>
                  )}
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-600/20 focus:outline-none">
                    {editingPlan ? 'Save Changes' : 'Create Draft'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonPlanView;
