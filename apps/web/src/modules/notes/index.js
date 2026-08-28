import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { confirmDialog } from "../../shared/ui/dialog/confirm-dialog.js";
import { toast } from "../../shared/ui/toast/toast.js";

registerTranslations("zh-CN", "notes", zhCN);
registerTranslations("zh-TW", "notes", zhTW);
registerTranslations("en", "notes", en);

export default {
  async mount(container, { workspaceId }) {
    let notes = [];
    const token = localStorage.getItem("auth:token") || "";
    const headers = {
      "x-auth-password": token,
      "x-workspace-id": workspaceId,
      "content-type": "application/json",
    };

    const loadNotes = async (search = "") => {
      try {
        const url = search ? `/api/notes?search=${encodeURIComponent(search)}` : "/api/notes";
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (data.ok) {
          notes = data.data;
          renderList();
        }
      } catch {
        notes = [];
        renderList();
      }
    };

    const renderList = () => {
      const listContainer = container.querySelector("#notes-list");
      if (!listContainer) return;

      if (notes.length === 0) {
        listContainer.innerHTML = `
          <ds-empty-state icon="file-text" title="${t("notes.noNotes")}" description="${
          t("notes.createFirst")
        }">
            <ds-button id="btn-empty-new" icon="plus">${t("notes.newNote")}</ds-button>
          </ds-empty-state>
        `;
        listContainer.querySelector("#btn-empty-new")?.addEventListener(
          "click",
          () => openEditDialog(),
        );
        return;
      }

      listContainer.innerHTML = `
        <div class="card-grid">
          ${
        notes.map((n) => `
            <ds-card class="note-card" data-id="${n.id}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2);">
                <div style="font-weight: 600; font-size: var(--text-base); color: var(--color-fg);">${n.title}</div>
                ${n.is_pinned ? `<ds-badge variant="primary">${t("notes.pinned")}</ds-badge>` : ""}
              </div>
              <div style="font-size: var(--text-sm); color: var(--color-fg-muted); margin-top: var(--space-2); white-space: pre-wrap; line-height: 1.4; max-height: 6rem; overflow: hidden; text-overflow: ellipsis;">${
          n.content || ""
        }</div>
              ${
          n.tags
            ? `
                <div style="display: flex; gap: var(--space-1); flex-wrap: wrap; margin-top: var(--space-3);">
                  ${
              n.tags.split(",").filter(Boolean).map((tag) =>
                `<ds-badge variant="outline">${tag.trim()}</ds-badge>`
              ).join("")
            }
                </div>
              `
            : ""
        }
              <div style="display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-2);">
                <ds-button class="btn-edit" size="sm" variant="ghost" icon="edit" data-id="${n.id}">${
          t("common.edit")
        }</ds-button>
                <ds-button class="btn-delete" size="sm" variant="ghost" icon="trash-2" data-id="${n.id}">${
          t("common.delete")
        }</ds-button>
              </div>
            </ds-card>
          `).join("")
      }
        </div>
      `;

      listContainer.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const note = notes.find((n) => n.id === btn.getAttribute("data-id"));
          if (note) openEditDialog(note);
        });
      });

      listContainer.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const ok = await confirmDialog({
            title: t("notes.deleteConfirmTitle"),
            description: t("notes.deleteConfirmDesc"),
            confirmLabel: t("common.delete"),
            danger: true,
          });
          if (ok) {
            await fetch(`/api/notes/${id}`, { method: "DELETE", headers });
            toast.success(t("common.success"));
            await loadNotes();
          }
        });
      });
    };

    const openEditDialog = (note = null) => {
      const isEdit = !!note;
      const dialog = document.createElement("ds-dialog");
      dialog.setAttribute("title", isEdit ? t("notes.editNote") : t("notes.newNote"));

      dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("notes.noteTitle")
      }</label>
            <ds-input id="input-title" value="${note?.title || ""}"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("notes.noteContent")
      }</label>
            <ds-textarea id="input-content" rows="6" value="${note?.content || ""}"></ds-textarea>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("notes.noteTags")
      }</label>
            <ds-input id="input-tags" placeholder="work, tech, ideas" value="${
        note?.tags || ""
      }"></ds-input>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-1);">
            <ds-switch id="switch-pinned" ${note?.is_pinned ? "checked" : ""}></ds-switch>
            <span style="font-size: var(--text-sm);">${t("notes.pinNote")}</span>
          </div>
        </div>
        <div slot="footer" style="display: flex; gap: var(--space-2); justify-content: flex-end;">
          <ds-button id="btn-cancel" variant="outline">${t("common.cancel")}</ds-button>
          <ds-button id="btn-save" variant="primary">${t("common.save")}</ds-button>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.open = true;

      dialog.querySelector("#btn-cancel").addEventListener("click", () => {
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
      });

      dialog.querySelector("#btn-save").addEventListener("click", async () => {
        const title = dialog.querySelector("#input-title").value.trim();
        const content = dialog.querySelector("#input-content").value;
        const tags = dialog.querySelector("#input-tags").value;
        const isPinned = dialog.querySelector("#switch-pinned").checked;

        if (!title) return;

        const payload = { title, content, tags, isPinned };
        if (isEdit) {
          await fetch(`/api/notes/${note.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload),
          });
        } else {
          await fetch("/api/notes", { method: "POST", headers, body: JSON.stringify(payload) });
        }

        toast.success(t("common.success"));
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
        await loadNotes();
      });
    };

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("notes.title")}</h1>
            <p class="page-description">${t("notes.description")}</p>
          </div>
          <ds-button id="btn-new-note" icon="plus">${t("notes.newNote")}</ds-button>
        </div>

        <div style="max-width: 24rem;">
          <ds-input id="search-input" icon="search" placeholder="${
      t("notes.searchPlaceholder")
    }"></ds-input>
        </div>

        <div id="notes-list"></div>
      </div>
    `;

    container.querySelector("#btn-new-note").addEventListener("click", () => openEditDialog());
    container.querySelector("#search-input").addEventListener("ds-input", (e) => {
      loadNotes(e.detail.value);
    });

    await loadNotes();
  },

  unmount() {},
};
