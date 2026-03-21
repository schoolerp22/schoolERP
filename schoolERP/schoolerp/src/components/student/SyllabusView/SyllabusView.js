import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentSyllabus } from '../../../feature/students/studentSlice';
import { Download, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SyllabusView = ({ studentId }) => {
  const dispatch = useDispatch();
  const { syllabus } = useSelector((state) => state.student);

  useEffect(() => {
    if (studentId) {
      dispatch(getStudentSyllabus(studentId));
    }
  }, [studentId, dispatch]);

  const API_Base = process.env.REACT_APP_API_URL || '';

  return (
    <div className="space-y-4 sm:space-y-8 p-1">
      <div className="bg-white rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 sm:px-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600">
              Class Syllabus
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-1">
              View and download your course syllabus documents.
            </p>
          </div>
        </div>

        {(!syllabus || syllabus.length === 0) ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 border border-slate-100 rounded-[24px] p-12 text-center mx-4 sm:mx-0 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-indigo-300" />
            </div>
            <h4 className="text-lg font-bold text-slate-700 mb-1">No Syllabus Available</h4>
            <p className="text-slate-500 font-medium text-sm">Your teachers haven't uploaded any syllabus for your class yet.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 outline-none">
            <AnimatePresence>
            {syllabus.map((syl, i) => (
              <motion.div 
                key={syl._id} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-80" />
                <div className="flex justify-between items-start gap-4 pl-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {syl.subject}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(syl.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 leading-tight mt-2 text-lg">
                      {syl.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                         <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-600 font-bold">T</span>
                         {syl.teacher?.name || 'Teacher'}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 mt-3 text-sm leading-relaxed pl-2 line-clamp-2">
                  {syl.description || "No description provided."}
                </p>

                {syl.attachment && (
                  <div className="mt-5 pt-4 border-t border-gray-50 flex pl-2">
                    <a
                      href={`${API_Base}${syl.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 rounded-xl text-sm font-semibold transition-colors w-full justify-center"
                    >
                      <Download size={16} />
                      Download attachment
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusView;
