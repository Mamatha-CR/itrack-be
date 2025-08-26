import { Screen, RoleScreenPermission, Role } from "../models/index.js";

export function rbac(screenName, action) {
  return async function (req, res, next) {
    try {
      // Super admin bypass
      if (req.user?.role_slug === "super_admin") return next();

      const roleId = req.user?.role_id;
      if (!roleId) return res.status(401).json({ message: "Unauthenticated" });

      // Find screen by name (exact match)
      const screen = await Screen.findOne({ where: { name: screenName } });
      if (!screen) {
        return res.status(403).json({ message: `Forbidden: screen '${screenName}' not found` });
      }

      // Resolve PK of Screen safely
      const screenPkAttr = Screen.primaryKeyAttribute || "screen_id";
      const screenId = screen.get ? screen.get(screenPkAttr) : screen[screenPkAttr];

      // Optional: sanity check role exists (useful during debugging)
      // const role = await Role.findByPk(roleId);
      // if (!role) return res.status(403).json({ message: "Forbidden: role not found" });

      // Fetch permission
      const perm = await RoleScreenPermission.findOne({
        where: { role_id: roleId, screen_id: screenId },
      });
      if (!perm) {
        return res.status(403).json({ message: `Forbidden: no permission for '${screenName}'` });
      }

      const fieldMap = { view: "can_view", add: "can_add", edit: "can_edit", delete: "can_delete" };
      const field = fieldMap[action] || "can_view";

      if (!perm[field]) {
        return res.status(403).json({ message: `Forbidden: lacks ${action} on '${screenName}'` });
      }

      return next();
    } catch (e) {
      return next(e);
    }
  };
}
