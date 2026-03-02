import API from "../auth/axios";

// Classes
const getClasses = async () => {
    const response = await API.get("/api/accounting/classes");
    return response.data;
};

const createClass = async (classData) => {
    const response = await API.post("/api/accounting/classes", classData);
    return response.data;
};

// Fee Heads
const getFeeHeads = async () => {
    const response = await API.get("/api/accounting/fee-heads");
    return response.data;
};

const createFeeHead = async (feeHeadData) => {
    const response = await API.post("/api/accounting/fee-heads", feeHeadData);
    return response.data;
};

// Fee Structures
const getFeeStructure = async (className) => {
    const response = await API.get(`/api/accounting/fee-structure/class/${className}`);
    return response.data;
};

const saveFeeStructure = async (structureData) => {
    const response = await API.post("/api/accounting/fee-structure", structureData);
    return response.data;
};

// Students & Dues
const getStudents = async (params) => {
    const { className, search } = params;
    let query = "";
    if (className) query += `className=${className}&`;
    if (search) query += `search=${search}&`;

    const response = await API.get(`/api/accounting/students?${query}`);
    return response.data;
};

const getStudentDues = async (admissionNo) => {
    const response = await API.get(`/api/accounting/students/${admissionNo}/dues`);
    return response.data;
};

// Payments & Receipts
const collectPayment = async (paymentData) => {
    const response = await API.post("/api/accounting/payments/collect", paymentData);
    return response.data;
};

const getReceipts = async (params = {}) => {
    const { studentId, startDate, endDate } = params;
    let query = "";
    if (studentId) query += `studentId=${studentId}&`;
    if (startDate) query += `startDate=${startDate}&`;
    if (endDate) query += `endDate=${endDate}&`;

    const response = await API.get(`/api/accounting/payments/receipts?${query}`);
    return response.data;
};

const getReceiptById = async (receiptId) => {
    const response = await API.get(`/api/accounting/payments/receipt/${receiptId}`);
    return response.data;
};

// Dashboard
const getDashboardStats = async () => {
    const response = await API.get("/api/accounting/dashboard/stats");
    return response.data;
};

const accountingService = {
    getClasses,
    createClass,
    getFeeHeads,
    createFeeHead,
    getFeeStructure,
    saveFeeStructure,
    getStudents,
    getStudentDues,
    collectPayment,
    getReceipts,
    getReceiptById,
    getDashboardStats
};

export default accountingService;
