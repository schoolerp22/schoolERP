import React, { useState, useEffect, useRef } from "react";
import API from "../../../feature/auth/axios";
import {
    School, MapPin, BookOpen, UserCog, IndianRupee, FileText,
    Bell, Shield, File, Globe, Save, Upload, CheckCircle, AlertCircle,
    ChevronRight
} from "lucide-react";

const TABS = [
    { id: "identity", label: "School Identity", icon: School, color: "text-blue-600" },
    { id: "contact", label: "Contact & Location", icon: MapPin, color: "text-green-600" },
    { id: "academic", label: "Academic Config", icon: BookOpen, color: "text-orange-600" },
    { id: "admin", label: "Administration", icon: UserCog, color: "text-purple-600" },
    { id: "finance", label: "Finance & Fees", icon: IndianRupee, color: "text-emerald-600" },
    { id: "exams", label: "Examinations", icon: FileText, color: "text-red-600" },
    { id: "communication", label: "Communication", icon: Bell, color: "text-yellow-600" },
    { id: "users", label: "Users & Roles", icon: Shield, color: "text-indigo-600" },
    { id: "documents", label: "Documents", icon: File, color: "text-pink-600" },
    { id: "saas", label: "SaaS & Subscription", icon: Globe, color: "text-cyan-600" },
];

const INITIAL = {
    // Identity
    schoolName: "", shortName: "", tagline: "", establishedYear: "",
    board: "", registrationNumber: "", udiseCode: "",
    // Contact
    address1: "", address2: "", city: "", state: "", country: "India",
    postalCode: "", phone: "", phone2: "", email: "", website: "", mapLink: "",
    // Academic
    currentSession: "", sessionStart: "", sessionEnd: "",
    classStructure: "", sectionFormat: "A,B,C", classTeacherRequired: "Yes",
    passingPercentage: "33", gradingSystem: "Marks",
    // Admin
    principalName: "", language: "English", timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY", currency: "INR", currencySymbol: "₹",
    attendanceType: "Daily", workingDays: "Mon-Sat",
    // Finance
    feeReceiptPrefix: "RCT-", invoicePrefix: "INV-", lateFeeRule: "",
    fineType: "Fixed", paymentMethods: "Cash,UPI,Cheque",
    bankName: "", accountNumber: "", ifsc: "", taxGST: "",
    // Exams
    examTypes: "Unit Test,Midterm,Final", resultFormat: "Percentage",
    rankingEnabled: "Yes", autoPromotion: "No",
    // Communication
    smsApiKey: "", smtpHost: "", smtpPort: "", smtpUser: "", smtpPass: "",
    whatsappApi: "", senderId: "",
    // Users
    passwordMinLength: "8", twoFactorAuth: "No",
    studentIdFormat: "STD{YEAR}{000}", employeeIdFormat: "EMP{000}",
    // Documents
    admissionNoFormat: "ADM-{YEAR}-{000}", tcFormat: "Standard",
    bonafideFormat: "Standard", idCardTemplate: "Standard",
    // SaaS
    subdomain: "", planType: "Basic", studentLimit: "", staffLimit: "",
    storageLimit: "", subscriptionStart: "", subscriptionExpiry: "",
    paymentStatus: "Active", themeColor: "#4F46E5",
};

const Field = ({ label, children, hint }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

const Input = ({ value, onChange, placeholder, type = "text", ...props }) => (
    <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
        {...props}
    />
);

const Select = ({ value, onChange, options, ...props }) => (
    <select
        value={value || ""}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white transition"
        {...props}
    >
        {options.map(o => typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
    </select>
);

const SectionTitle = ({ children }) => (
    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 mt-6 flex items-center gap-2">
        <ChevronRight size={14} /> {children}
    </h3>
);

const ImageUpload = ({ label, field, currentSrc, onUpload }) => {
    const ref = useRef();
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
            <div className="flex items-center gap-3">
                {currentSrc ? (
                    <img src={`http://localhost:5000${currentSrc}`} alt={label} className="w-14 h-14 rounded-lg object-cover border" />
                ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-gray-300">
                        <Upload size={18} />
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1"
                >
                    <Upload size={12} /> Upload
                </button>
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => onUpload(field, e.target.files[0])} />
            </div>
        </div>
    );
};

export default function SchoolSettingsView() {
    const [activeTab, setActiveTab] = useState("identity");
    const [settings, setSettings] = useState(INITIAL);
    const [status, setStatus] = useState(null); // 'saving' | 'success' | 'error'
    const [message, setMessage] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        API.get("/api/admin/school-settings", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setSettings(s => ({ ...s, ...r.data })))
            .catch(() => { });
    }, [token]);

    const set = (field) => (e) => setSettings(s => ({ ...s, [field]: e.target.value }));

    const handleSave = async () => {
        setStatus("saving");
        try {
            const res = await API.put("/api/admin/school-settings", settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(s => ({ ...s, ...res.data.settings }));
            setStatus("success");
            setMessage("Settings saved successfully!");
        } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Failed to save settings");
        }
        setTimeout(() => setStatus(null), 3000);
    };

    const handleUpload = async (field, file) => {
        if (!file) return;
        const form = new FormData();
        form.append(field, file);
        try {
            const res = await API.post("/api/admin/school-settings/upload", form, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            setSettings(s => ({ ...s, ...res.data.paths }));
            setStatus("success");
            setMessage("Image uploaded!");
            setTimeout(() => setStatus(null), 2000);
        } catch {
            setStatus("error");
            setMessage("Upload failed");
            setTimeout(() => setStatus(null), 2000);
        }
    };

    const renderTab = () => {
        switch (activeTab) {
            case "identity":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="School Name *"><Input value={settings.schoolName} onChange={set("schoolName")} placeholder="Chaitanya Public School" /></Field>
                        <Field label="Short Name / Code"><Input value={settings.shortName} onChange={set("shortName")} placeholder="CPS" /></Field>
                        <Field label="Tagline / Motto" ><Input value={settings.tagline} onChange={set("tagline")} placeholder="Nurturing Minds, Building Futures" /></Field>
                        <Field label="Established Year"><Input value={settings.establishedYear} onChange={set("establishedYear")} placeholder="1995" type="number" /></Field>
                        <Field label="Affiliation / Board">
                            <Select value={settings.board} onChange={set("board")} options={["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"]} />
                        </Field>
                        <Field label="School Registration Number"><Input value={settings.registrationNumber} onChange={set("registrationNumber")} /></Field>
                        <Field label="UDISE Code" hint="India-specific unique school ID"><Input value={settings.udiseCode} onChange={set("udiseCode")} /></Field>
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ImageUpload label="School Logo" field="logo" currentSrc={settings.logo} onUpload={handleUpload} />
                            <ImageUpload label="Favicon" field="favicon" currentSrc={settings.favicon} onUpload={handleUpload} />
                        </div>
                    </div>
                );

            case "contact":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Address Line 1"><Input value={settings.address1} onChange={set("address1")} placeholder="123 School Road" /></Field>
                        <Field label="Address Line 2"><Input value={settings.address2} onChange={set("address2")} placeholder="Near Landmark" /></Field>
                        <Field label="City"><Input value={settings.city} onChange={set("city")} placeholder="Barhara" /></Field>
                        <Field label="State"><Input value={settings.state} onChange={set("state")} placeholder="Bihar" /></Field>
                        <Field label="Country"><Input value={settings.country} onChange={set("country")} /></Field>
                        <Field label="Postal Code"><Input value={settings.postalCode} onChange={set("postalCode")} placeholder="802163" /></Field>
                        <Field label="Primary Phone"><Input value={settings.phone} onChange={set("phone")} placeholder="+91 9708100171" /></Field>
                        <Field label="Secondary Phone"><Input value={settings.phone2} onChange={set("phone2")} placeholder="+91 9162277422" /></Field>
                        <Field label="Email Address"><Input value={settings.email} onChange={set("email")} type="email" placeholder="school@example.com" /></Field>
                        <Field label="Website"><Input value={settings.website} onChange={set("website")} placeholder="https://schoolname.com" /></Field>
                        <Field label="Google Map Link" hint="Paste your school's Google Maps URL"><Input value={settings.mapLink} onChange={set("mapLink")} /></Field>
                    </div>
                );

            case "academic":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Current Academic Session"><Input value={settings.currentSession} onChange={set("currentSession")} placeholder="2025–26" /></Field>
                        <Field label="Session Start Date"><Input value={settings.sessionStart} onChange={set("sessionStart")} type="date" /></Field>
                        <Field label="Session End Date"><Input value={settings.sessionEnd} onChange={set("sessionEnd")} type="date" /></Field>
                        <Field label="Class Structure" hint="e.g. Nursery–12 or LKG–10"><Input value={settings.classStructure} onChange={set("classStructure")} /></Field>
                        <Field label="Sections Naming Format" hint="e.g. A,B,C or 1,2,3"><Input value={settings.sectionFormat} onChange={set("sectionFormat")} /></Field>
                        <Field label="Class Teacher Required?">
                            <Select value={settings.classTeacherRequired} onChange={set("classTeacherRequired")} options={["Yes", "No"]} />
                        </Field>
                        <Field label="Default Passing Percentage"><Input value={settings.passingPercentage} onChange={set("passingPercentage")} type="number" placeholder="33" /></Field>
                        <Field label="Grading System">
                            <Select value={settings.gradingSystem} onChange={set("gradingSystem")} options={["Marks", "Grade", "Both", "CGPA"]} />
                        </Field>
                    </div>
                );

            case "admin":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Principal Name"><Input value={settings.principalName} onChange={set("principalName")} /></Field>
                        <Field label="Default Language"><Select value={settings.language} onChange={set("language")} options={["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"]} /></Field>
                        <Field label="Time Zone"><Select value={settings.timezone} onChange={set("timezone")} options={["Asia/Kolkata", "Asia/Dubai", "UTC", "America/New_York", "Europe/London"]} /></Field>
                        <Field label="Date Format"><Select value={settings.dateFormat} onChange={set("dateFormat")} options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} /></Field>
                        <Field label="Currency"><Input value={settings.currency} onChange={set("currency")} placeholder="INR" /></Field>
                        <Field label="Currency Symbol"><Input value={settings.currencySymbol} onChange={set("currencySymbol")} placeholder="₹" /></Field>
                        <Field label="Attendance Type"><Select value={settings.attendanceType} onChange={set("attendanceType")} options={["Daily", "Subject Wise"]} /></Field>
                        <Field label="Working Days"><Select value={settings.workingDays} onChange={set("workingDays")} options={["Mon-Fri", "Mon-Sat", "Mon-Sun", "Custom"]} /></Field>
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ImageUpload label="Principal Signature" field="principalSignature" currentSrc={settings.principalSignature} onUpload={handleUpload} />
                            <ImageUpload label="School Stamp" field="schoolStamp" currentSrc={settings.schoolStamp} onUpload={handleUpload} />
                        </div>
                    </div>
                );

            case "finance":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Fee Receipt Prefix" hint="e.g. RCT-2025-"><Input value={settings.feeReceiptPrefix} onChange={set("feeReceiptPrefix")} /></Field>
                        <Field label="Invoice Prefix"><Input value={settings.invoicePrefix} onChange={set("invoicePrefix")} /></Field>
                        <Field label="Late Fee Rule" hint="e.g. ₹50 per day after 10th"><Input value={settings.lateFeeRule} onChange={set("lateFeeRule")} /></Field>
                        <Field label="Fine Calculation Type"><Select value={settings.fineType} onChange={set("fineType")} options={["Fixed", "Daily"]} /></Field>
                        <Field label="Default Payment Methods" hint="Comma separated: Cash,UPI,Cheque"><Input value={settings.paymentMethods} onChange={set("paymentMethods")} /></Field>
                        <Field label="Tax / GST Number"><Input value={settings.taxGST} onChange={set("taxGST")} /></Field>
                        <SectionTitle>Bank Account Details</SectionTitle>
                        <Field label="Bank Name"><Input value={settings.bankName} onChange={set("bankName")} /></Field>
                        <Field label="Account Number"><Input value={settings.accountNumber} onChange={set("accountNumber")} /></Field>
                        <Field label="IFSC Code"><Input value={settings.ifsc} onChange={set("ifsc")} /></Field>
                    </div>
                );

            case "exams":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Exam Types" hint="Comma separated"><Input value={settings.examTypes} onChange={set("examTypes")} /></Field>
                        <Field label="Result Format"><Select value={settings.resultFormat} onChange={set("resultFormat")} options={["Percentage", "Grade", "CGPA"]} /></Field>
                        <Field label="Ranking System"><Select value={settings.rankingEnabled} onChange={set("rankingEnabled")} options={["Yes", "No"]} /></Field>
                        <Field label="Auto Promotion"><Select value={settings.autoPromotion} onChange={set("autoPromotion")} options={["Yes", "No"]} /></Field>
                    </div>
                );

            case "communication":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SectionTitle>SMS</SectionTitle>
                        <Field label="SMS API Key"><Input value={settings.smsApiKey} onChange={set("smsApiKey")} type="password" /></Field>
                        <Field label="Sender ID"><Input value={settings.senderId} onChange={set("senderId")} /></Field>
                        <SectionTitle>Email (SMTP)</SectionTitle>
                        <Field label="SMTP Host"><Input value={settings.smtpHost} onChange={set("smtpHost")} placeholder="smtp.gmail.com" /></Field>
                        <Field label="SMTP Port"><Input value={settings.smtpPort} onChange={set("smtpPort")} placeholder="587" /></Field>
                        <Field label="SMTP Username"><Input value={settings.smtpUser} onChange={set("smtpUser")} /></Field>
                        <Field label="SMTP Password"><Input value={settings.smtpPass} onChange={set("smtpPass")} type="password" /></Field>
                        <SectionTitle>WhatsApp</SectionTitle>
                        <Field label="WhatsApp API Key" hint="Optional"><Input value={settings.whatsappApi} onChange={set("whatsappApi")} type="password" /></Field>
                    </div>
                );

            case "users":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Minimum Password Length"><Input value={settings.passwordMinLength} onChange={set("passwordMinLength")} type="number" /></Field>
                        <Field label="Two-Factor Authentication"><Select value={settings.twoFactorAuth} onChange={set("twoFactorAuth")} options={["No", "Yes"]} /></Field>
                        <Field label="Student ID Format" hint="Use {YEAR} and {000} as placeholders"><Input value={settings.studentIdFormat} onChange={set("studentIdFormat")} /></Field>
                        <Field label="Employee ID Format"><Input value={settings.employeeIdFormat} onChange={set("employeeIdFormat")} /></Field>
                    </div>
                );

            case "documents":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Admission Number Format" hint="e.g. ADM-{YEAR}-{000}"><Input value={settings.admissionNoFormat} onChange={set("admissionNoFormat")} /></Field>
                        <Field label="Transfer Certificate Format"><Select value={settings.tcFormat} onChange={set("tcFormat")} options={["Standard", "Custom"]} /></Field>
                        <Field label="Bonafide Certificate Format"><Select value={settings.bonafideFormat} onChange={set("bonafideFormat")} options={["Standard", "Custom"]} /></Field>
                        <Field label="ID Card Template"><Select value={settings.idCardTemplate} onChange={set("idCardTemplate")} options={["Standard", "Custom"]} /></Field>
                    </div>
                );

            case "saas":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Subdomain" hint="e.g. chaitanya (→ chaitanya.schoolerp.com)"><Input value={settings.subdomain} onChange={set("subdomain")} /></Field>
                        <Field label="Plan Type"><Select value={settings.planType} onChange={set("planType")} options={["Basic", "Pro", "Premium", "Enterprise"]} /></Field>
                        <Field label="Student Limit"><Input value={settings.studentLimit} onChange={set("studentLimit")} type="number" /></Field>
                        <Field label="Staff Limit"><Input value={settings.staffLimit} onChange={set("staffLimit")} type="number" /></Field>
                        <Field label="Storage Limit (GB)"><Input value={settings.storageLimit} onChange={set("storageLimit")} type="number" /></Field>
                        <Field label="Subscription Start"><Input value={settings.subscriptionStart} onChange={set("subscriptionStart")} type="date" /></Field>
                        <Field label="Subscription Expiry"><Input value={settings.subscriptionExpiry} onChange={set("subscriptionExpiry")} type="date" /></Field>
                        <Field label="Payment Status"><Select value={settings.paymentStatus} onChange={set("paymentStatus")} options={["Active", "Pending", "Expired", "Suspended"]} /></Field>
                        <Field label="Theme Color" hint="Primary accent color for the school's UI">
                            <div className="flex items-center gap-2">
                                <input type="color" value={settings.themeColor || "#4F46E5"} onChange={set("themeColor")} className="w-10 h-9 rounded border cursor-pointer" />
                                <Input value={settings.themeColor} onChange={set("themeColor")} placeholder="#4F46E5" />
                            </div>
                        </Field>
                    </div>
                );

            default:
                return null;
        }
    };

    const activeTabInfo = TABS.find(t => t.id === activeTab);

    return (
        <div className="flex h-full gap-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Left Tab Sidebar */}
            <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800 text-base">School Settings</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Configure your school</p>
                </div>
                <nav className="flex-1 overflow-y-auto py-2">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors text-sm ${activeTab === tab.id
                                    ? "bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Icon size={15} className={activeTab === tab.id ? "text-indigo-600" : tab.color} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Section Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {activeTabInfo && <activeTabInfo.icon size={20} className={activeTabInfo.color} />}
                        <div>
                            <h3 className="font-semibold text-gray-800">{activeTabInfo?.label}</h3>
                            <p className="text-xs text-gray-400">Fill in the details and click Save</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={status === "saving"}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {status === "saving" ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={15} /> Save Settings</>
                        )}
                    </button>
                </div>

                {/* Toast */}
                {status && status !== "saving" && (
                    <div className={`mx-6 mt-3 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium ${status === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {status === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {message}
                    </div>
                )}

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderTab()}
                </div>
            </div>
        </div>
    );
}
