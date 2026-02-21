
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Save, Plus, Trash2, Clock, Calendar } from "lucide-react";
import { saveTimetable, getTimetable } from "../../../feature/teachers/teacherSlice";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TimetableManagement = ({ teacherId, selectedClass }) => {
    const dispatch = useDispatch();
    const { timetable, loading } = useSelector((state) => state.teacher);

    const [activeDay, setActiveDay] = useState("Monday");
    const [schedule, setSchedule] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const periodsEndRef = useRef(null);

    // Initialize schedule structure
    useEffect(() => {
        const initialSchedule = {};
        DAYS.forEach(day => {
            initialSchedule[day] = [];
        });
        setSchedule(initialSchedule);
    }, []);

    // Fetch timetable when class changes
    useEffect(() => {
        if (selectedClass) {
            dispatch(getTimetable({ teacherId, classSection: selectedClass }));
        }
    }, [selectedClass, teacherId, dispatch]);

    // Update local state when timetable is fetched
    useEffect(() => {
        if (timetable) {
            // Ensure all days exist
            const loadedSchedule = { ...timetable };
            DAYS.forEach(day => {
                if (!loadedSchedule[day]) loadedSchedule[day] = [];
            });
            setSchedule(loadedSchedule);
        } else {
            // Reset if no timetable found
            const initialSchedule = {};
            DAYS.forEach(day => {
                initialSchedule[day] = [];
            });
            setSchedule(initialSchedule);
        }
    }, [timetable]);

    const handleAddPeriod = () => {
        const newPeriod = {
            id: Date.now(),
            startTime: "",
            endTime: "",
            subject: "",
            type: "Class", // Class, Break, Assembly
            teacher: ""
        };

        setSchedule(prev => ({
            ...prev,
            [activeDay]: [...prev[activeDay], newPeriod]
        }));
        setHasChanges(true);
        setTimeout(() => {
            periodsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleRemovePeriod = (index) => {
        setSchedule(prev => {
            const updatedDay = [...prev[activeDay]];
            updatedDay.splice(index, 1);
            return { ...prev, [activeDay]: updatedDay };
        });
        setHasChanges(true);
    };

    const handleChange = (index, field, value) => {
        setSchedule(prev => {
            const updatedDay = [...prev[activeDay]];
            updatedDay[index] = { ...updatedDay[index], [field]: value };
            return { ...prev, [activeDay]: updatedDay };
        });
        setHasChanges(true);
    };

    const handleSave = () => {
        if (!selectedClass) return;
        dispatch(saveTimetable({
            teacherId,
            classSection: selectedClass,
            timetable: schedule
        }));
        setHasChanges(false);
    };

    if (!selectedClass) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Please select a class to manage timetable.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4 sm:space-y-6">
            <div className="bg-transparent sm:bg-white sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-sm sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-0">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Timetable Management</h2>
                    <p className="text-sm font-medium text-gray-500">Manage weekly schedule for Class {selectedClass}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || !hasChanges}
                    className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-sm active:scale-95 ${hasChanges
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        }`}
                >
                    {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
                {/* Day Tabs */}
                <div className="w-full sm:w-[220px] flex sm:flex-col overflow-x-auto hide-scrollbar gap-2 sm:gap-1.5 pb-2 sm:pb-0 px-4 sm:px-0 -mx-4 sm:mx-0 sm:bg-white sm:p-4 sm:rounded-xl sm:border sm:border-gray-100 sm:shadow-sm">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`flex-shrink-0 flex justify-between items-center px-5 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all font-bold text-sm ${activeDay === day
                                ? "bg-indigo-100 text-indigo-700 shadow-sm"
                                : "bg-white sm:bg-transparent text-gray-500 hover:bg-gray-50 border border-gray-100 sm:border-transparent"
                                }`}
                        >
                            <span>{day}</span>
                            <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold ml-2 ${activeDay === day ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                                {schedule[day]?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-transparent sm:bg-white sm:rounded-xl sm:border border-gray-100 sm:shadow-sm flex flex-col overflow-hidden mb-6 sm:mb-0 px-4 sm:px-0">
                    <div className="sm:p-6 sm:border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 tracking-tight">
                            <Calendar size={20} className="text-indigo-600" /> {activeDay}'s Schedule
                        </h3>
                        <button
                            onClick={handleAddPeriod}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 p-2 sm:px-4 sm:py-2 rounded-xl sm:rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
                        >
                            <Plus size={16} /> <span className="sm:inline">Add Period</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto sm:p-6 flex flex-col gap-4">
                        {schedule[activeDay]?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white sm:bg-transparent rounded-2xl border border-dashed border-gray-200 sm:border-0 shadow-sm sm:shadow-none">
                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                    <Clock size={32} className="text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-500 mb-2">No periods scheduled for {activeDay}</p>
                                <button onClick={handleAddPeriod} className="text-sm font-bold text-white active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-sm px-4 py-2 rounded-xl transition-all">
                                    + Add first period
                                </button>
                            </div>
                        ) : (
                            schedule[activeDay]?.map((period, index) => (
                                <div key={index} className="bg-white border border-gray-100 sm:border-gray-200 rounded-2xl sm:rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4 relative group">
                                    <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50/80">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-700"
                                                value={period.startTime}
                                                onChange={(e) => handleChange(index, "startTime", e.target.value)}
                                            />
                                        </div>
                                        <div className="text-gray-300 font-bold mt-4">-</div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">End</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-700"
                                                value={period.endTime}
                                                onChange={(e) => handleChange(index, "endTime", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
                                        <div className="flex flex-col w-full sm:w-1/4">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-700"
                                                value={period.type}
                                                onChange={(e) => handleChange(index, "type", e.target.value)}
                                            >
                                                <option value="Class">Class</option>
                                                <option value="Break">Break</option>
                                                <option value="Assembly">Assembly</option>
                                                <option value="Activity">Activity</option>
                                            </select>
                                        </div>

                                        {period.type === "Class" ? (
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
                                                <div className="flex flex-col flex-[2]">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Mathematics"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-700"
                                                        value={period.subject}
                                                        onChange={(e) => handleChange(index, "subject", e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-[2]">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Teacher</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Mr. Sharma"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-700"
                                                        value={period.teacher}
                                                        onChange={(e) => handleChange(index, "teacher", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col flex-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    placeholder={period.type === "Break" ? "e.g. Lunch Break" : "e.g. Morning Assembly"}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-700"
                                                    value={period.subject}
                                                    onChange={(e) => handleChange(index, "subject", e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleRemovePeriod(index)}
                                        className="sm:static absolute top-4 right-4 p-2 text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-100 rounded-lg transition-colors active:scale-95 border border-red-100/50"
                                        title="Remove Period"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                        <div ref={periodsEndRef} className="h-1" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableManagement;
