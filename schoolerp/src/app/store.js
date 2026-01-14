import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../feature/auth/authSlice";
import teacherReducer from "../feature/teachers/teacherSlice";
import studentReducer from "../feature/students/studentSlice";

// Debug middleware
const logger = (store) => (next) => (action) => {
  console.log("ACTION ===>", action);
  return next(action);
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teacher: teacherReducer,
    student: studentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger),
});

export default store;
