// The only user fields we ever send to the browser. The password hash is never included.
export default function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    settings: user.settings,
  };
}
