export const validateUser = (req, res) => {
  // If it reached here, middleware already verified token
  res.json({
    valid: true,
    user: req.user
  });
};
