import React from "react";
import List from "../../common/List";

const HomeworkView = ({ homework }) => {
  return <List title="Homework Assigned" data={homework} label="subject" />;
};

export default HomeworkView;