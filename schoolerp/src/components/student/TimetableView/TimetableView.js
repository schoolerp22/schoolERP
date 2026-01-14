import React from "react";
import List from "../../common/List";

const TimetableView = ({ timetable }) => {
  return <List title="Daily Timetable" data={timetable} label="subject" />;
};

export default TimetableView;