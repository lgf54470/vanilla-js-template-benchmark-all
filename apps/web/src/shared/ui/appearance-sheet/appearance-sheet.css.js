export const css = `
:host { display: inline-block; }
.trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.trigger-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
.panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 24rem;
  max-width: 90vw;
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
}
.panel-header {
  position: relative;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.panel-title {
  font-size: var(--text-lg);
  font-weight: 600;
  line-height: 1.25;
}
.panel-desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  margin-top: 0.25rem;
}
.close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
}
.close-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.section-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
  margin-bottom: var(--space-2);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.card-box {
  position: relative;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  overflow: visible;
  width: 100%;
  background: var(--color-muted);
}
.preview-card--active .card-box {
  border-color: var(--color-primary);
}
.check-badge {
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--color-fg-muted);
}
.preview-card--active .card-label {
  color: var(--color-fg);
  font-weight: 500;
}
.swatches-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
}
.swatch-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.swatch-dot {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.swatch-dot--zinc { background-color: var(--swatch-zinc); }
.swatch-dot--slate { background-color: var(--swatch-slate); }
.swatch-dot--stone { background-color: var(--swatch-stone); }
.swatch-dot--gray { background-color: var(--swatch-gray); }
.swatch-dot--neutral { background-color: var(--swatch-neutral); }
.swatch-dot--red { background-color: var(--swatch-red); }
.swatch-dot--rose { background-color: var(--swatch-rose); }
.swatch-dot--orange { background-color: var(--swatch-orange); }
.swatch-dot--green { background-color: var(--swatch-green); }
.swatch-dot--blue { background-color: var(--swatch-blue); }
.swatch-dot--yellow { background-color: var(--swatch-yellow); }
.swatch-dot--violet { background-color: var(--swatch-violet); }

.swatch-label {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  text-transform: lowercase;
}
.swatch-btn--active .swatch-label {
  color: var(--color-fg);
  font-weight: 500;
}
.segmented-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  background-color: var(--color-muted);
  padding: 0.25rem;
  border-radius: var(--radius-md);
}
.seg-btn {
  flex: 1;
  min-width: 2.5rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
}
.seg-btn--active {
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-weight: 500;
  box-shadow: var(--shadow-xs);
}
.readonly-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.readonly-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-fg-muted);
}
.readonly-badge {
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  padding: 0.125rem 0.625rem;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-fg-muted);
}
.panel-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}
.btn-reset {
  width: 100%;
  height: 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
.btn-reset:hover {
  background-color: var(--color-muted);
}
`;
