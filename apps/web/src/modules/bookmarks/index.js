import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { confirmDialog } from "../../shared/ui/dialog/confirm-dialog.js";
import { toast } from "../../shared/ui/toast/toast.js";

registerTranslations("zh-CN", "bookmarks", zhCN);
registerTranslations("zh-TW", "bookmarks", zhTW);
registerTranslations("en", "bookmarks", en);

export default {
  async mount(container, { workspaceId }) {
    let bookmarks = [];
    const token = localStorage.getItem("auth:token") || "";
    const headers = {
      "x-auth-password": token,
      "x-workspace-id": workspaceId,
      "content-type": "application/json",
    };

    const loadBookmarks = async () => {
      try {
        const res = await fetch("/api/bookmarks", { headers });
        const data = await res.json();
        if (data.ok) {
          bookmarks = data.data;
          renderList();
        }
      } catch {
        bookmarks = [];
        renderList();
      }
    };

    const renderList = () => {
      const listContainer = container.querySelector("#bookmarks-list");
      if (!listContainer) return;

      if (bookmarks.length === 0) {
        listContainer.innerHTML = `
          <ds-empty-state icon="bookmark" title="${t("bookmarks.noBookmarks")}" description="${
          t("bookmarks.createFirst")
        }">
            <ds-button id="btn-empty-new" icon="plus">${t("bookmarks.newBookmark")}</ds-button>
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
        bookmarks.map((bm) => `
            <ds-card class="bm-card" data-id="${bm.id}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2);">
                <div style="font-weight: 600; font-size: var(--text-base); color: var(--color-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${bm.title}</div>
                <ds-badge variant="outline">${bm.category || "default"}</ds-badge>
              </div>
              <div style="font-size: var(--text-xs); color: var(--color-fg-muted); margin-top: var(--space-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <a href="${bm.url}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary);">${bm.url}</a>
              </div>
              ${
          bm.description
            ? `<div style="font-size: var(--text-sm); color: var(--color-fg-muted); margin-top: var(--space-2);">${bm.description}</div>`
            : ""
        }
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-2);">
                <a href="${bm.url}" target="_blank" rel="noopener noreferrer">
                  <ds-button size="sm" variant="ghost" icon="external-link">${
          t("bookmarks.openLink")
        }</ds-button>
                </a>
                <div style="display: flex; gap: var(--space-1);">
                  <ds-button class="btn-edit" size="sm" variant="ghost" icon="edit" data-id="${bm.id}"></ds-button>
                  <ds-button class="btn-delete" size="sm" variant="ghost" icon="trash-2" data-id="${bm.id}"></ds-button>
                </div>
              </div>
            </ds-card>
          `).join("")
      }
        </div>
      `;

      listContainer.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = bookmarks.find((b) => b.id === btn.getAttribute("data-id"));
          if (item) openEditDialog(item);
        });
      });

      listContainer.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const ok = await confirmDialog({
            title: t("bookmarks.deleteConfirmTitle"),
            description: t("bookmarks.deleteConfirmDesc"),
            confirmLabel: t("common.delete"),
            danger: true,
          });
          if (ok) {
            await fetch(`/api/bookmarks/${id}`, { method: "DELETE", headers });
            toast.success(t("common.success"));
            await loadBookmarks();
          }
        });
      });
    };

    const openEditDialog = (item = null) => {
      const isEdit = !!item;
      const dialog = document.createElement("ds-dialog");
      dialog.setAttribute(
        "title",
        isEdit ? t("bookmarks.editBookmark") : t("bookmarks.newBookmark"),
      );

      dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("bookmarks.bmTitle")
      }</label>
            <ds-input id="input-title" placeholder="GitHub" value="${item?.title || ""}"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("bookmarks.bmUrl")
      }</label>
            <ds-input id="input-url" placeholder="https://github.com" value="${
        item?.url || ""
      }"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("bookmarks.bmCategory")
      }</label>
            <ds-input id="input-cat" placeholder="dev, tools, docs" value="${
        item?.category || "default"
      }"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("bookmarks.bmDesc")
      }</label>
            <ds-textarea id="input-desc" rows="2" placeholder="备注..." value="${
        item?.description || ""
      }"></ds-textarea>
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
        const url = dialog.querySelector("#input-url").value.trim();
        const category = dialog.querySelector("#input-cat").value.trim() || "default";
        const description = dialog.querySelector("#input-desc").value;

        if (!title || !url) return;

        const payload = { title, url, category, description };
        if (isEdit) {
          await fetch(`/api/bookmarks/${item.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload),
          });
        } else {
          await fetch("/api/bookmarks", { method: "POST", headers, body: JSON.stringify(payload) });
        }

        toast.success(t("common.success"));
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
        await loadBookmarks();
      });
    };

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("bookmarks.title")}</h1>
            <p class="page-description">${t("bookmarks.description")}</p>
          </div>
          <ds-button id="btn-new-bm" icon="plus">${t("bookmarks.newBookmark")}</ds-button>
        </div>

        <div id="bookmarks-list"></div>
      </div>
    `;

    container.querySelector("#btn-new-bm").addEventListener("click", () => openEditDialog());
    await loadBookmarks();
  },

  unmount() {},
};
