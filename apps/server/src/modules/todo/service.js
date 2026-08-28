import { createTodoRepository } from "./repository.js";

export function createTodoService(db) {
  const repo = createTodoRepository(db);

  return {
    async listTodos(workspaceId, status = "") {
      const scoped = repo.forWorkspace(workspaceId);
      if (!status) {
        return await scoped.list("ORDER BY created_at DESC");
      }
      return await scoped.list("AND status = ? ORDER BY created_at DESC", [status]);
    },

    async getTodo(workspaceId, id) {
      return await repo.forWorkspace(workspaceId).findById(id);
    },

    async createTodo(
      workspaceId,
      { title, description = "", status = "pending", priority = "medium", dueDate = null },
    ) {
      const id = "todo_" + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();
      await repo.forWorkspace(workspaceId).insert({
        id,
        title,
        description,
        status,
        priority,
        due_date: dueDate,
        created_at: now,
        updated_at: now,
      });
      return await this.getTodo(workspaceId, id);
    },

    async updateTodo(workspaceId, id, patch) {
      const updateData = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) updateData.title = patch.title;
      if (patch.description !== undefined) updateData.description = patch.description;
      if (patch.status !== undefined) updateData.status = patch.status;
      if (patch.priority !== undefined) updateData.priority = patch.priority;
      if (patch.dueDate !== undefined) updateData.due_date = patch.dueDate;

      await repo.forWorkspace(workspaceId).update(id, updateData);
      return await this.getTodo(workspaceId, id);
    },

    async deleteTodo(workspaceId, id) {
      return await repo.forWorkspace(workspaceId).remove(id);
    },
  };
}
