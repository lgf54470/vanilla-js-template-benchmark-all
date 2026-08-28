// apps/web/src/modules/notes/index.js — 笔记模块（M6，全量 CRUD）
//
// 页面容器：page-container（Layout.md §4）；样式经 ensurePageStyles 注入。
// 数据：/api/notes（GET 列表/POST 创建/PUT 更新/DELETE 删除）+ /api/notes/tags
// （标签聚合）。交互：标签 chip 过滤、卡片点击编辑、删除走 confirmDialog
// （硬规则 4：禁 alert/confirm）、成功/失败 ds-toast 反馈。
//
// ctx：{ t, http, locale, workspaceId, navigate }（assemble.js 注入）。
// 工作空间切换由壳层完全重挂本模块 → mount 时重新拉取，天然隔离。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";
import { iconSvg } from "../../shared/lib/icons.js";
import { confirmDialog } from "../../shared/ui/dialog/dialog.js";
import { toast } from "../../shared/ui/toast/toast.js";

registerModuleI18n(import.meta.url);

const TAG_ALL = "";

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "./styles/notes.css");
  const { t, http, locale } = ctx;

  let notes = [];
  let tags = [];
  let activeTag = TAG_ALL;
  let dialogNoteId = null;

  container.innerHTML = `
    <div class="page-container notes-page">
      <div class="notes-header">
        <div>
          <h1 class="notes-title">${t("notes.list.title")}</h1>
          <p class="notes-subtitle">${t("notes.list.subtitle")}</p>
        </div>
        <ds-button variant="primary" icon="plus" id="btn-new">${
    t("notes.action.create")
  }</ds-button>
      </div>
      <div class="notes-toolbar" id="toolbar"></div>
      <div class="notes-list" id="list"></div>
      <div class="notes-empty" id="empty" hidden>
        <ds-empty-state icon="notebook-pen" title="${t("notes.empty.title")}"
          description="${t("notes.empty.description")}"></ds-empty-state>
      </div>
    </div>
    <ds-dialog id="dialog" title="${t("notes.dialog.createTitle")}">
      <div class="note-form">
        <ds-input id="f-title" placeholder="${
    t("notes.form.titlePlaceholder")
  }" autocomplete="off"></ds-input>
        <ds-textarea id="f-content" placeholder="${
    t("notes.form.contentPlaceholder")
  }"></ds-textarea>
        <div class="note-form__row">
          <ds-input id="f-tag" placeholder="${
    t("notes.form.tagPlaceholder")
  }" autocomplete="off"></ds-input>
          <ds-checkbox id="f-pinned" label="${
    t("notes.form.pinned")
  }"></ds-checkbox>
        </div>
      </div>
      <div slot="actions">
        <ds-button id="dialog-cancel" variant="ghost">${
    t("notes.action.cancel")
  }</ds-button>
        <ds-button id="dialog-save" variant="primary">${
    t("notes.action.save")
  }</ds-button>
      </div>
    </ds-dialog>`;

  const listEl = container.querySelector("#list");
  const emptyEl = container.querySelector("#empty");
  const toolbarEl = container.querySelector("#toolbar");
  const dialog = container.querySelector("#dialog");
  const fTitle = container.querySelector("#f-title");
  const fContent = container.querySelector("#f-content");
  const fTag = container.querySelector("#f-tag");
  const fPinned = container.querySelector("#f-pinned");

  const fmtTime = (iso) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  function visibleNotes() {
    if (!activeTag) return notes;
    return notes.filter((n) => n.tag === activeTag);
  }

  function renderToolbar() {
    toolbarEl.innerHTML = "";
    const all = document.createElement("button");
    all.type = "button";
    all.className = "tag-chip";
    all.dataset.tag = TAG_ALL;
    all.setAttribute("aria-pressed", String(activeTag === TAG_ALL));
    all.textContent = t("notes.tag.all");
    all.addEventListener("click", () => setActiveTag(TAG_ALL));
    toolbarEl.append(all);
    for (const { tag, count } of tags) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-chip";
      chip.dataset.tag = tag;
      chip.setAttribute("aria-pressed", String(activeTag === tag));
      const name = document.createElement("span");
      name.textContent = tag;
      const cnt = document.createElement("span");
      cnt.className = "count";
      cnt.textContent = String(count);
      chip.append(name, cnt);
      chip.addEventListener("click", () => setActiveTag(tag));
      toolbarEl.append(chip);
    }
  }

  function setActiveTag(tag) {
    activeTag = tag;
    renderList();
    renderToolbar();
  }

  function renderList() {
    const items = visibleNotes();
    listEl.innerHTML = "";
    emptyEl.hidden = items.length > 0;
    listEl.hidden = items.length === 0;

    for (const note of items) {
      const card = document.createElement("article");
      card.className = "note-card";
      card.dataset.id = String(note.id);

      const head = document.createElement("div");
      head.className = "note-card__head";
      const title = document.createElement("span");
      title.className = "note-card__title";
      title.textContent = note.title;
      head.append(title);
      if (note.isPinned) {
        const pin = document.createElement("span");
        pin.className = "note-card__pinned";
        pin.title = t("notes.pinned");
        pin.innerHTML = iconSvg("tag", 14);
        head.append(pin);
      }
      card.append(head);

      if (note.content) {
        const content = document.createElement("p");
        content.className = "note-card__content";
        content.textContent = note.content;
        card.append(content);
      }

      const foot = document.createElement("div");
      foot.className = "note-card__foot";
      const time = document.createElement("span");
      time.className = "note-card__time";
      time.textContent = t("notes.updatedAt", {
        time: fmtTime(note.updatedAt),
      });
      foot.append(time);
      const actions = document.createElement("div");
      actions.className = "note-card__actions";

      const editBtn = document.createElement("ds-icon-button");
      editBtn.setAttribute("icon", "edit");
      editBtn.setAttribute("aria-label", t("notes.action.edit"));
      editBtn.addEventListener("click", () => openDialog(note));
      const delBtn = document.createElement("ds-icon-button");
      delBtn.setAttribute("icon", "trash");
      delBtn.setAttribute("aria-label", t("notes.action.delete"));
      delBtn.addEventListener("click", () => handleDelete(note));
      actions.append(editBtn, delBtn);
      foot.append(actions);
      card.append(foot);
      listEl.append(card);
    }
  }

  function openDialog(note = null) {
    dialogNoteId = note?.id ?? null;
    dialog.setAttribute(
      "title",
      note ? t("notes.dialog.editTitle") : t("notes.dialog.createTitle"),
    );
    fTitle.setAttribute("value", note?.title ?? "");
    fContent.setAttribute("value", note?.content ?? "");
    fTag.setAttribute("value", note?.tag ?? "");
    fPinned.toggleAttribute("checked", !!note?.isPinned);
    dialog.show();
    fTitle.focus?.();
  }

  async function handleSave() {
    const payload = {
      title: fTitle.getAttribute("value") ?? "",
      content: fContent.getAttribute("value") ?? "",
      tag: fTag.getAttribute("value") ?? "",
      isPinned: fPinned.hasAttribute("checked"),
    };
    try {
      if (dialogNoteId == null) {
        const created = await http("/api/notes", {
          method: "POST",
          body: payload,
        });
        toast.success(t("notes.toast.created", { title: created.title }));
      } else {
        const updated = await http(`/api/notes/${dialogNoteId}`, {
          method: "PUT",
          body: payload,
        });
        toast.success(t("notes.toast.updated", { title: updated.title }));
      }
      dialog.close();
      await refresh();
    } catch (err) {
      toast.error(err?.message ?? t("notes.error.loadFailed"));
    }
  }

  async function handleDelete(note) {
    const ok = await confirmDialog({
      title: t("notes.deleteConfirm.title"),
      description: t("notes.deleteConfirm.description", { title: note.title }),
      confirmLabel: t("notes.action.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await http(`/api/notes/${note.id}`, { method: "DELETE" });
      toast.success(t("notes.toast.deleted", { title: note.title }));
      await refresh();
    } catch (err) {
      toast.error(err?.message ?? t("notes.error.loadFailed"));
    }
  }

  async function refresh() {
    try {
      const [list, tagRows] = await Promise.all([
        http("/api/notes"),
        http("/api/notes/tags"),
      ]);
      notes = list;
      tags = tagRows;
      renderList();
      renderToolbar();
    } catch (err) {
      toast.error(err?.message ?? t("notes.error.loadFailed"));
    }
  }

  container.querySelector("#btn-new").addEventListener(
    "click",
    () => openDialog(),
  );
  container.querySelector("#dialog-cancel").addEventListener(
    "click",
    () => dialog.close(),
  );
  container.querySelector("#dialog-save").addEventListener("click", handleSave);
  fTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fContent.focus?.();
    }
  });

  refresh();

  // 清理：模块被卸载（切路由/工作空间）时释放
  return () => {
    container.innerHTML = "";
    dialog.remove();
  };
}
