import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { confirmDialog } from "../../shared/ui/dialog/confirm-dialog.js";
import { toast } from "../../shared/ui/toast/toast.js";

registerTranslations("zh-CN", "passwords", zhCN);
registerTranslations("zh-TW", "passwords", zhTW);
registerTranslations("en", "passwords", en);

export default {
  async mount(container, { workspaceId }) {
    let passwords = [];
    const token = localStorage.getItem("auth:token") || "";
    const headers = {
      "x-auth-password": token,
      "x-workspace-id": workspaceId,
      "content-type": "application/json",
    };

    const loadPasswords = async () => {
      try {
        const res = await fetch("/api/passwords", { headers });
        const data = await res.json();
        if (data.ok) {
          passwords = data.data;
          renderList();
        }
      } catch {
        passwords = [];
        renderList();
      }
    };

    const renderList = () => {
      const listContainer = container.querySelector("#passwords-list");
      if (!listContainer) return;

      if (passwords.length === 0) {
        listContainer.innerHTML = `
          <ds-empty-state icon="key" title="${t("passwords.noPasswords")}" description="${
          t("passwords.createFirst")
        }">
            <ds-button id="btn-empty-new" icon="plus">${t("passwords.newPassword")}</ds-button>
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
        passwords.map((item) => `
            <ds-card class="pwd-card" data-id="${item.id}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2);">
                <div style="font-weight: 600; font-size: var(--text-base); color: var(--color-fg);">${item.title}</div>
                ${
          item.website
            ? `<a href="${item.website}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); font-size: var(--text-xs);">链接</a>`
            : ""
        }
              </div>
              <div style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-1);">
                <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">${item.username}</div>
                <masked-field id="field-${item.id}" mask-type="generic"></masked-field>
              </div>
              ${
          item.notes
            ? `<div style="font-size: var(--text-xs); color: var(--color-fg-muted); margin-top: var(--space-2);">${item.notes}</div>`
            : ""
        }
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-2);">
                <ds-button class="btn-copy" size="sm" variant="ghost" icon="copy" data-id="${item.id}">${
          t("passwords.copyPassword")
        }</ds-button>
                <div style="display: flex; gap: var(--space-1);">
                  <ds-button class="btn-edit" size="sm" variant="ghost" icon="edit" data-id="${item.id}"></ds-button>
                  <ds-button class="btn-delete" size="sm" variant="ghost" icon="trash-2" data-id="${item.id}"></ds-button>
                </div>
              </div>
            </ds-card>
          `).join("")
      }
        </div>
      `;

      // Set masked field values
      passwords.forEach((item) => {
        const el = listContainer.querySelector(`#field-${item.id}`);
        if (el) el.value = item.password;
      });

      listContainer.querySelectorAll(".btn-copy").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const item = passwords.find((p) => p.id === btn.getAttribute("data-id"));
          if (item) {
            await navigator.clipboard.writeText(item.password);
            toast.success(t("passwords.copied"));
          }
        });
      });

      listContainer.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = passwords.find((p) => p.id === btn.getAttribute("data-id"));
          if (item) openEditDialog(item);
        });
      });

      listContainer.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const ok = await confirmDialog({
            title: t("passwords.deleteConfirmTitle"),
            description: t("passwords.deleteConfirmDesc"),
            confirmLabel: t("common.delete"),
            danger: true,
          });
          if (ok) {
            await fetch(`/api/passwords/${id}`, { method: "DELETE", headers });
            toast.success(t("common.success"));
            await loadPasswords();
          }
        });
      });
    };

    const openEditDialog = (item = null) => {
      const isEdit = !!item;
      const dialog = document.createElement("ds-dialog");
      dialog.setAttribute(
        "title",
        isEdit ? t("passwords.editPassword") : t("passwords.newPassword"),
      );

      dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("passwords.pwdTitle")
      }</label>
            <ds-input id="input-title" placeholder="GitHub / Google" value="${
        item?.title || ""
      }"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("passwords.pwdUsername")
      }</label>
            <ds-input id="input-user" placeholder="alice@example.com" value="${
        item?.username || ""
      }"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("passwords.pwdPassword")
      }</label>
            <ds-input id="input-pwd" type="password" value="${item?.password || ""}"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("passwords.pwdWebsite")
      }</label>
            <ds-input id="input-site" placeholder="https://..." value="${
        item?.website || ""
      }"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("passwords.pwdNotes")
      }</label>
            <ds-textarea id="input-notes" rows="2" value="${item?.notes || ""}"></ds-textarea>
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
        const username = dialog.querySelector("#input-user").value.trim();
        const password = dialog.querySelector("#input-pwd").value;
        const website = dialog.querySelector("#input-site").value.trim();
        const notes = dialog.querySelector("#input-notes").value;

        if (!title || !username || !password) return;

        const payload = { title, username, password, website, notes };
        if (isEdit) {
          await fetch(`/api/passwords/${item.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload),
          });
        } else {
          await fetch("/api/passwords", { method: "POST", headers, body: JSON.stringify(payload) });
        }

        toast.success(t("common.success"));
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
        await loadPasswords();
      });
    };

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("passwords.title")}</h1>
            <p class="page-description">${t("passwords.description")}</p>
          </div>
          <ds-button id="btn-new-pwd" icon="plus">${t("passwords.newPassword")}</ds-button>
        </div>

        <div id="passwords-list"></div>
      </div>
    `;

    container.querySelector("#btn-new-pwd").addEventListener("click", () => openEditDialog());
    await loadPasswords();
  },

  unmount() {},
};
