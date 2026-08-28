import "./dialog.js";

export function confirmAction(
  {
    title = "确认操作",
    message = "此操作不可逆，是否继续？",
    confirmText = "确认",
    cancelText = "取消",
    variant = "default",
  } = {},
) {
  return new Promise((resolve) => {
    const dialog = document.createElement("ds-dialog");
    dialog.innerHTML = `
      <div style="font-size: var(--text-lg); font-weight: 600;">${title}</div>
      <div style="font-size: var(--text-sm); color: var(--color-fg-muted);">${message}</div>
      <div style="display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4);">
        <ds-button variant="outline" id="btn-cancel">${cancelText}</ds-button>
        <ds-button variant="${variant}" id="btn-confirm">${confirmText}</ds-button>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.open = true;

    const cleanup = (result) => {
      dialog.open = false;
      dialog.remove();
      resolve(result);
    };

    dialog.querySelector("#btn-cancel")?.addEventListener("click", () => cleanup(false));
    dialog.querySelector("#btn-confirm")?.addEventListener("click", () => cleanup(true));
    dialog.addEventListener("ds-close", () => cleanup(false));
  });
}
