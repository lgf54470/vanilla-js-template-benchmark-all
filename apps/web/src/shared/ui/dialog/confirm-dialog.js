import "./dialog.js";
import "../button/button.js";

export function confirmDialog(options = {}) {
  const {
    title = "确认操作",
    description = "此操作不可逆，是否继续？",
    confirmLabel = "确认",
    cancelLabel = "取消",
    danger = false,
  } = options;

  return new Promise((resolve) => {
    const dialog = document.createElement("ds-dialog");
    dialog.setAttribute("title", title);
    dialog.setAttribute("description", description);

    dialog.innerHTML = `
      <div slot="footer" style="display: flex; gap: var(--space-2); justify-content: flex-end;">
        <ds-button class="cancel-btn" variant="outline">${cancelLabel}</ds-button>
        <ds-button class="confirm-btn" variant="${
      danger ? "danger" : "primary"
    }">${confirmLabel}</ds-button>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.open = true;

    const cleanup = () => {
      dialog.open = false;
      setTimeout(() => dialog.remove(), 100);
    };

    dialog.querySelector(".cancel-btn").addEventListener("click", () => {
      cleanup();
      resolve(false);
    });

    dialog.querySelector(".confirm-btn").addEventListener("click", () => {
      cleanup();
      resolve(true);
    });

    dialog.addEventListener("ds-close", () => {
      cleanup();
      resolve(false);
    });
  });
}
