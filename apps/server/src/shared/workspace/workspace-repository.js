export function createWorkspaceRepository(db) {
  return {
    async listAll() {
      return await db.query(
        "SELECT * FROM core_workspaces ORDER BY sort_order ASC, created_at ASC",
      );
    },
    async findById(id) {
      const rows = await db.query("SELECT * FROM core_workspaces WHERE id = ?", [id]);
      return rows[0] ?? null;
    },
    async create(workspace) {
      const { id, name, icon = "folder", color_token = "zinc", sort_order = 0, is_system = 0 } =
        workspace;
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO core_workspaces (id, name, icon, color_token, sort_order, is_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, icon, color_token, sort_order, is_system, now, now],
      );
      return {
        id,
        name,
        icon,
        color_token,
        sort_order,
        is_system,
        created_at: now,
        updated_at: now,
      };
    },
    async update(id, patch) {
      const allowed = ["name", "icon", "color_token", "sort_order"];
      const keys = Object.keys(patch).filter((k) => allowed.includes(k));
      if (keys.length === 0) return null;

      const now = new Date().toISOString();
      const setClause = keys.map((k) => `${k} = ?`).join(", ") + ", updated_at = ?";
      const values = [...keys.map((k) => patch[k]), now, id];

      await db.execute(`UPDATE core_workspaces SET ${setClause} WHERE id = ?`, values);
      const rows = await db.query("SELECT * FROM core_workspaces WHERE id = ?", [id]);
      return rows[0] ?? null;
    },
    async delete(id) {
      const res = await db.execute(
        "DELETE FROM core_workspaces WHERE id = ? AND is_system = 0",
        [id],
      );
      return res.changes > 0;
    },
  };
}
