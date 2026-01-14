import React from "react";
import List from "../../common/List";

const AnnouncementsView = ({ announcements }) => {
  return <List title="Announcements" data={announcements} label="title" />;
};

export default AnnouncementsView;