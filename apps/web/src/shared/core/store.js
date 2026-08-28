export function createStore(initialState = {}) {
  let state = { ...initialState };
  const target = new EventTarget();

  return {
    getState: () => state,
    setState: (updater) => {
      const next = typeof updater === "function" ? updater(state) : updater;
      state = { ...state, ...next };
      target.dispatchEvent(new CustomEvent("change", { detail: state }));
    },
    subscribe: (listener) => {
      const handler = (e) => listener(e.detail);
      target.addEventListener("change", handler);
      return () => target.removeEventListener("change", handler);
    },
  };
}
