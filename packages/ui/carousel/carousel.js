import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: block; position: relative; width: 100%; }
.carousel {
  position: relative;
  overflow: hidden;
  width: 100%;
}
.track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.track::-webkit-scrollbar { display: none; }
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.nav-btn-prev { left: var(--space-2); }
.nav-btn-next { right: var(--space-2); }
`;

export class DsCarousel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="carousel" class="carousel">
        <button data-slot="carousel-previous" class="nav-btn nav-btn-prev" id="prev">${
      createIcon("chevron-left")
    }</button>
        <div data-slot="carousel-content" class="track">
          <slot></slot>
        </div>
        <button data-slot="carousel-next" class="nav-btn nav-btn-next" id="next">${
      createIcon("chevron-right")
    }</button>
      </div>
    `;

    const track = this.shadowRoot.querySelector(".track");
    this.shadowRoot.querySelector("#prev")?.addEventListener("click", () => {
      track?.scrollBy({ left: -300, behavior: "smooth" });
    });
    this.shadowRoot.querySelector("#next")?.addEventListener("click", () => {
      track?.scrollBy({ left: 300, behavior: "smooth" });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-carousel")) customElements.define("ds-carousel", DsCarousel);
