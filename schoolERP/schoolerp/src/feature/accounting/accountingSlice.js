import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import accountingService from "./accountingService";

const initialState = {
    classes: [],
    feeHeads: [],
    currentFeeStructure: null,
    students: [],
    studentDues: null,
    receipts: [],
    currentReceipt: null,
    dashboardStats: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
};

// Async Thunks
export const getClasses = createAsyncThunk("accounting/getClasses", async (_, thunkAPI) => {
    try {
        return await accountingService.getClasses();
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getFeeHeads = createAsyncThunk("accounting/getFeeHeads", async (_, thunkAPI) => {
    try {
        return await accountingService.getFeeHeads();
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getFeeStructure = createAsyncThunk("accounting/getFeeStructure", async (className, thunkAPI) => {
    try {
        return await accountingService.getFeeStructure(className);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getStudents = createAsyncThunk("accounting/getStudents", async (params, thunkAPI) => {
    try {
        return await accountingService.getStudents(params);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getStudentDues = createAsyncThunk("accounting/getStudentDues", async (admissionNo, thunkAPI) => {
    try {
        return await accountingService.getStudentDues(admissionNo);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const collectPayment = createAsyncThunk("accounting/collectPayment", async (paymentData, thunkAPI) => {
    try {
        return await accountingService.collectPayment(paymentData);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getReceipts = createAsyncThunk("accounting/getReceipts", async (params, thunkAPI) => {
    try {
        return await accountingService.getReceipts(params);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getDashboardStats = createAsyncThunk("accounting/getStats", async (_, thunkAPI) => {
    try {
        return await accountingService.getDashboardStats();
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const getReceiptById = createAsyncThunk("accounting/getReceiptById", async (receiptId, thunkAPI) => {
    try {
        return await accountingService.getReceiptById(receiptId);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const createClass = createAsyncThunk("accounting/createClass", async (classData, thunkAPI) => {
    try {
        return await accountingService.createClass(classData);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const createFeeHead = createAsyncThunk("accounting/createFeeHead", async (feeHeadData, thunkAPI) => {
    try {
        return await accountingService.createFeeHead(feeHeadData);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const saveFeeStructure = createAsyncThunk("accounting/saveFeeStructure", async (structureData, thunkAPI) => {
    try {
        return await accountingService.saveFeeStructure(structureData);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const accountingSlice = createSlice({
    name: "accounting",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
        clearCurrentStudent: (state) => {
            state.studentDues = null;
        },
        clearCurrentReceipt: (state) => {
            state.currentReceipt = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Classes
            .addCase(getClasses.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getClasses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classes = action.payload;
            })
            .addCase(getClasses.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Fee Heads
            .addCase(getFeeHeads.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFeeHeads.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.feeHeads = action.payload;
            })
            .addCase(getFeeHeads.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Fee Structure
            .addCase(getFeeStructure.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFeeStructure.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentFeeStructure = action.payload;
            })
            .addCase(getFeeStructure.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Students
            .addCase(getStudents.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getStudents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.students = action.payload;
            })
            .addCase(getStudents.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Student Dues
            .addCase(getStudentDues.pending, (state) => {
                state.isLoading = true;
                state.studentDues = null;
            })
            .addCase(getStudentDues.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.studentDues = action.payload;
            })
            .addCase(getStudentDues.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Collect Payment
            .addCase(collectPayment.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(collectPayment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = "Payment collected successfully";
                state.currentReceipt = action.payload;
            })
            .addCase(collectPayment.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Get Receipts List
            .addCase(getReceipts.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getReceipts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // API returns { receipts: [...], total, page, pages }
                state.receipts = action.payload?.receipts || action.payload || [];
            })
            .addCase(getReceipts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })


            .addCase(getDashboardStats.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDashboardStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.dashboardStats = action.payload;
            })
            .addCase(getDashboardStats.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Get Receipt By Id
            .addCase(getReceiptById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getReceiptById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentReceipt = action.payload;
            })
            .addCase(getReceiptById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Create Class
            .addCase(createClass.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createClass.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = "Class created successfully";
            })
            .addCase(createClass.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Create Fee Head
            .addCase(createFeeHead.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createFeeHead.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = "Fee head created successfully";
            })
            .addCase(createFeeHead.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Save Fee Structure
            .addCase(saveFeeStructure.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(saveFeeStructure.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message || "Fee structure saved successfully";
            })
            .addCase(saveFeeStructure.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearCurrentStudent, clearCurrentReceipt } = accountingSlice.actions;
export default accountingSlice.reducer;
