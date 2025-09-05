if (user.isBlocked) {
  return res.status(403).json({ message: "Your account has been blocked by admin." });
}
