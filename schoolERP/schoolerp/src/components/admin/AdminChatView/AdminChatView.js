import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
import ClassChat from '../../common/ClassChat/ClassChat';
import { MessageSquare } from 'lucide-react';
// import axios from 'axios';

const AdminChatView = ({ adminId }) => {
    // Admin needs to select which class/section to view chat for
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loadingClasses, setLoadingClasses] = useState(true);

    const currentUser = {
        id: adminId || 'admin',
        name: 'School Admin',
        role: 'admin'
    };

    // Fetch available classes to populate dropdown
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                // Assuming we can fetch distinct classes from students collection or classes collection
                // This would usually be an API call. For now, let's assume we have an endpoint
                // or we use a static list until the backend generates it.
                // const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/${adminId}/classes`);

                // Fallback static list for demonstration since we might not have a dedicated endpoint yet
                const demoClasses = [
                    { class: '10', sections: ['A', 'B', 'C'] },
                    { class: '9', sections: ['A', 'B'] },
                    { class: '8', sections: ['A', 'D'] }
                ];
                setClasses(demoClasses);
                setLoadingClasses(false);
                console.log('loadingClasses',loadingClasses)
            } catch (error) {
                console.error("Failed to load classes", error);
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, [adminId]);

    const handleClassChange = (e) => {
        setSelectedClass(e.target.value);
        setSelectedSection(''); // Reset section when class changes
    };

    const availableSections = classes.find(c => c.class === selectedClass)?.sections || [];

    return (
        <div className="space-y-4 h-full flex flex-col p-4 md:p-6 lg:p-8">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-6 text-white shadow-lg shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="text-blue-200" />
                        School Communications
                    </h2>
                    <p className="text-blue-100/80 mt-1">Select a class and section to view or participate in their chat group.</p>
                </div>

                {/* Selector */}
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="bg-white/20 border border-white/30 text-white placeholder-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 w-full md:w-32 [&>option]:text-gray-900"
                        value={selectedClass}
                        onChange={handleClassChange}
                    >
                        <option value="" disabled className="text-gray-500">Class</option>
                        {classes.map(c => (
                            <option key={c.class} value={c.class}>{c.class}</option>
                        ))}
                    </select>

                    <select
                        className="bg-white/20 border border-white/30 text-white placeholder-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 w-full md:w-32 [&>option]:text-gray-900"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={!selectedClass}
                    >
                        <option value="" disabled className="text-gray-500">Section</option>
                        {availableSections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 min-h-[500px] h-full pb-16 md:pb-0">
                {!selectedClass || !selectedSection ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100 mt-2">
                        <MessageSquare size={64} className="text-gray-200 mb-4" />
                        <h3 className="text-xl font-medium text-gray-600">Select a Chat Group</h3>
                        <p className="mt-2 text-center max-w-sm">Use the dropdowns above to select a Class and Section to join the conversation.</p>
                    </div>
                ) : (
                    <ClassChat
                        classNum={selectedClass}
                        section={selectedSection}
                        currentUser={currentUser}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminChatView;
