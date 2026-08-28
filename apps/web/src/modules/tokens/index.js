export function mount(container, _ctx) {
  container.innerHTML = `
    <div class="page-container">
      <ds-page-placeholder icon="sparkles" title="模块开发中" description="该模块在 M6 落地。"></ds-page-placeholder>
    </div>`;
  return () => {};
}
