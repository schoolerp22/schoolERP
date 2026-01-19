import React from 'react';
import { useDispatch } from 'react-redux';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { approveLeave } from '../../../feature/teachers/teacherSlice';

const LeavesView = ({ leaveRequests, teacherId, loading }) => {
  const dispatch = useDispatch();

  const handleApproveLeave = (leaveId, status) => {
    dispatch(approveLeave({
      teacherId,
      leaveData: {
        leaveId,
        status,
        remarks: ''
      }
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h3>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {leaveRequests && leaveRequests.length > 0 ? (
            leaveRequests.map((leave) => (
              <div key={leave._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{leave.student_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{leave.admission_no}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Duration:</span> {leave.from_date} to {leave.to_date}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Reason:</span> {leave.reason}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveLeave(leave._id, 'Approved')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveLeave(leave._id, 'Rejected')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No pending leave requests
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeavesView;