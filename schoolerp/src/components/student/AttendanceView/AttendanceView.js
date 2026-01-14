import React from "react";
import List from "../../common/List";

const AttendanceView = ({ attendance }) => {
  return <List title="Attendance Records" data={attendance} label="status" />;
};

export default AttendanceView;