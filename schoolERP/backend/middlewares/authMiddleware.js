import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ valid: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ valid: false, message: "Invalid or expired token" });
  }
};

/**
 * Authorize middleware to check if the user has specific roles
 * @param {...string} roles - The roles allowed to access the route
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ valid: false, message: "Unauthorized: User role not found" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        valid: false,
        message: `Forbidden: User role ${req.user.role} is not authorized`
      });
    }

    next();
  };
};
