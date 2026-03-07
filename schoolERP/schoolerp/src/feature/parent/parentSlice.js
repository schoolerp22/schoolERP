import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../auth/axios";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ─── Thunks ───
export const fetchChildren = createAsyncThunk("parent/fetchChildren", async (_, { rejectWithValue }) => {
    try {
        const res = await API.get("/api/parent/children", { headers: headers() });
        return res.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

export const fetchAttendance = createAsyncThunk("parent/fetchAttendance", async ({ admissionNo, month }, { rejectWithValue }) => {
    try {
        const res = await API.get(`/api/parent/child/${admissionNo}/attendance${month ? `?month=${month}` : ''}`, { headers: headers() });
        return { admissionNo, data: res.data };
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

export const fetchResults = createAsyncThunk("parent/fetchResults", async ({ admissionNo, year }, { rejectWithValue }) => {
    try {
        const res = await API.get(`/api/parent/child/${admissionNo}/results${year ? `?year=${year}` : ''}`, { headers: headers() });
        return { admissionNo, data: res.data };
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

export const fetchFees = createAsyncThunk("parent/fetchFees", async (admissionNo, { rejectWithValue }) => {
    try {
        const res = await API.get(`/api/parent/child/${admissionNo}/fees`, { headers: headers() });
        return { admissionNo, data: res.data };
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

export const fetchReceipts = createAsyncThunk("parent/fetchReceipts", async (admissionNo, { rejectWithValue }) => {
    try {
        const res = await API.get(`/api/parent/child/${admissionNo}/receipts`, { headers: headers() });
        return { admissionNo, data: res.data };
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

export const createPaymentOrder = createAsyncThunk("parent/createPaymentOrder", async (payload, { rejectWithValue }) => {
    try {
        const res = await API.post("/api/parent/fees/create-order", payload, { headers: headers() });
        return res.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed to create order"); }
});

export const verifyPayment = createAsyncThunk("parent/verifyPayment", async (payload, { rejectWithValue }) => {
    try {
        const res = await API.post("/api/parent/fees/verify-payment", payload, { headers: headers() });
        return res.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Payment verification failed"); }
});

export const fetchNotifications = createAsyncThunk("parent/fetchNotifications", async (_, { rejectWithValue }) => {
    try {
        const res = await API.get("/api/parent/notifications", { headers: headers() });
        return res.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

export const markNotificationRead = createAsyncThunk("parent/markNotificationRead", async (id, { rejectWithValue }) => {
    try {
        await API.patch(`/api/parent/notifications/${id}/read`, {}, { headers: headers() });
        return id;
    } catch (e) { return rejectWithValue(e.response?.data?.message || "Failed"); }
});

// ─── Slice ───
const parentSlice = createSlice({
    name: "parent",
    initialState: {
        children: [],
        selectedChild: null,
        attendance: {},
        results: {},
        fees: {},
        receipts: {},
        notifications: [],
        paymentOrder: null,
        loading: false,
        error: null,
        success: null,
    },
    reducers: {
        setSelectedChild: (state, action) => { state.selectedChild = action.payload; },
        clearParentError: (state) => { state.error = null; state.success = null; },
        clearPaymentOrder: (state) => { state.paymentOrder = null; },
    },
    extraReducers: (builder) => {
        const pend = (state) => { state.loading = true; state.error = null; };
        const rej = (state, a) => { state.loading = false; state.error = a.payload; };

        builder
            .addCase(fetchChildren.pending, pend)
            .addCase(fetchChildren.fulfilled, (state, a) => {
                state.loading = false;
                state.children = a.payload;
                if (!state.selectedChild && a.payload.length > 0) state.selectedChild = a.payload[0];
            })
            .addCase(fetchChildren.rejected, rej)

            .addCase(fetchAttendance.pending, pend)
            .addCase(fetchAttendance.fulfilled, (state, a) => {
                state.loading = false;
                state.attendance[a.payload.admissionNo] = a.payload.data;
            })
            .addCase(fetchAttendance.rejected, rej)

            .addCase(fetchResults.pending, pend)
            .addCase(fetchResults.fulfilled, (state, a) => {
                state.loading = false;
                state.results[a.payload.admissionNo] = a.payload.data;
            })
            .addCase(fetchResults.rejected, rej)

            .addCase(fetchFees.pending, pend)
            .addCase(fetchFees.fulfilled, (state, a) => {
                state.loading = false;
                state.fees[a.payload.admissionNo] = a.payload.data;
            })
            .addCase(fetchFees.rejected, rej)

            .addCase(fetchReceipts.pending, pend)
            .addCase(fetchReceipts.fulfilled, (state, a) => {
                state.loading = false;
                state.receipts[a.payload.admissionNo] = a.payload.data;
            })
            .addCase(fetchReceipts.rejected, rej)

            .addCase(createPaymentOrder.pending, pend)
            .addCase(createPaymentOrder.fulfilled, (state, a) => {
                state.loading = false;
                state.paymentOrder = a.payload;
            })
            .addCase(createPaymentOrder.rejected, rej)

            .addCase(verifyPayment.pending, pend)
            .addCase(verifyPayment.fulfilled, (state, a) => {
                state.loading = false;
                state.success = `Payment successful! Receipt: ${a.payload.receiptNo}`;
                state.paymentOrder = null;
            })
            .addCase(verifyPayment.rejected, rej)

            .addCase(fetchNotifications.fulfilled, (state, a) => { state.notifications = a.payload; })

            .addCase(markNotificationRead.fulfilled, (state, a) => {
                const n = state.notifications.find(n => n._id === a.payload);
                if (n) n.isRead = true;
            });
    },
});

export const { setSelectedChild, clearParentError, clearPaymentOrder } = parentSlice.actions;
export default parentSlice.reducer;
