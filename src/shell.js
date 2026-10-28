/* Injected into every app page. It draws one floating tab and nothing else:
 * no app data is read, no request is made, and no state is shared.
 */
(() => {
  if (customElements.get("atrium-shell")) return;

  const apps = __ATRIUM_APPS__;
  const currentSlug = window.location.pathname.split("/").filter(Boolean)[0] || "";

  const css = `
    :host {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 2147483647;
      font-family: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 13px;
      border: 1px solid rgb(238 242 237 / 18%);
      border-radius: 999px;
      background: #10201c;
      color: #eef2ed;
      box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
      font: 600 12px/1 "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.02em;
      cursor: pointer;
    }

    .trigger:hover { background: #172c26; }

    .trigger:focus-visible,
    .close:focus-visible,
    .room:focus-visible {
      outline: 2px solid #eef2ed;
      outline-offset: 2px;
    }

    .mark {
      display: flex;
      align-items: flex-end;
      gap: 1.5px;
      height: 14px;
    }

    .mark span {
      display: block;
      width: 2px;
      height: 100%;
      border-radius: 1px;
      background: var(--accent);
    }

    .mark span:nth-child(3n) { height: 68%; }
    .mark span:nth-child(3n + 1) { height: 86%; }

    .chevron {
      width: 10px;
      height: 10px;
      margin-left: 1px;
      transition: transform 0.18s ease;
    }

    .trigger[aria-expanded="true"] .chevron { transform: rotate(180deg); }

    .panel {
      position: absolute;
      left: 0;
      bottom: calc(100% + 10px);
      width: 280px;
      max-height: min(70vh, 520px);
      overflow-y: auto;
      padding: 14px;
      border: 1px solid rgb(238 242 237 / 16%);
      border-radius: 12px;
      background: #10201c;
      color: #eef2ed;
      box-shadow: 0 18px 48px rgb(0 0 0 / 26%);
    }

    .panel[hidden] { display: none; }

    .panel-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 0 4px 10px;
      border-bottom: 1px solid rgb(238 242 237 / 14%);
    }

    .panel-title {
      margin: 0;
      color: #a7b8af;
      font: 500 11px/1.2 "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.04em;
    }

    .close {
      padding: 2px;
      border: 0;
      background: transparent;
      color: #a7b8af;
      font: 500 12px/1 "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
    }

    .close:hover { color: #eef2ed; }

    .front {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0 2px;
      padding: 8px;
      border-radius: 6px;
      color: #eef2ed;
      font: 600 13px/1.2 "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
      text-decoration: none;
    }

    .front:hover,
    .room:hover {
      background: rgb(238 242 237 / 7%);
    }

    .room {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 8px;
      border-radius: 6px;
      color: #dce6df;
      font: 500 13px/1.25 "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
      text-decoration: none;
    }

    .room[aria-current="page"] {
      background: rgb(238 242 237 / 6%);
      color: #eef2ed;
    }

    .spine {
      flex: 0 0 3px;
      width: 3px;
      height: 14px;
      border-radius: 1px;
      background: var(--accent);
    }

    .name { min-width: 0; }

    .here {
      margin-left: auto;
      color: #a7b8af;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.03em;
    }

    .sep {
      height: 1px;
      margin: 8px 4px;
      background: rgb(238 242 237 / 12%);
    }

    .foot {
      margin: 10px 4px 2px;
      color: #a7b8af;
      font: 400 11px/1.4 "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
    }

    @media (max-width: 520px) {
      :host { left: 12px; bottom: 12px; }
      .panel { width: min(280px, calc(100vw - 24px)); }
    }

    @media (prefers-reduced-motion: reduce) {
      .chevron { transition: none; }
    }
  `;

  class AtriumShell extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;

      const root = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = css;

      const trigger = document.createElement("button");
      trigger.className = "trigger";
      trigger.type = "button";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", "atrium-panel");
      trigger.innerHTML = `
        <span class="mark" aria-hidden="true">${apps
          .map((app) => `<span style="--accent:${app.accent}"></span>`)
          .join("")}</span>
        <span>Atrium</span>
        <svg class="chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      const panel = document.createElement("div");
      panel.className = "panel";
      panel.id = "atrium-panel";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="panel-head">
          <p class="panel-title">The ten rooms</p>
          <button class="close" type="button">Close</button>
        </div>
        <a class="front" href="/">
          <span class="mark" aria-hidden="true">${apps
            .map((app) => `<span style="--accent:${app.accent}"></span>`)
            .join("")}</span>
          <span>Front door</span>
        </a>
        <div class="sep"></div>
        <nav aria-label="Atrium rooms">
          ${apps
            .map(
              (app) => `<a class="room" href="/${app.slug}/" style="--accent:${app.accent}"${
                app.slug === currentSlug ? ' aria-current="page"' : ""
              }>
                <span class="spine" aria-hidden="true"></span>
                <span class="name">${app.name}</span>
                ${app.slug === currentSlug ? '<span class="here">here</span>' : ""}
              </a>`,
            )
            .join("")}
        </nav>
        <p class="foot">One door. Ten separate data sets.</p>
      `;

      root.append(style, trigger, panel);

      const close = panel.querySelector(".close");
      const links = [...panel.querySelectorAll("a")];

      const setOpen = (open) => {
        panel.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
        if (open) {
          (links[0] || close).focus();
        }
      };

      trigger.addEventListener("click", () => {
        setOpen(panel.hidden);
      });

      close.addEventListener("click", () => {
        setOpen(false);
        trigger.focus();
      });

      panel.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          setOpen(false);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
          setOpen(false);
          trigger.focus();
        }
      });

      document.addEventListener(
        "click",
        (event) => {
          if (!this.contains(event.target) && !panel.hidden) {
            setOpen(false);
          }
        },
        true,
      );
    }
  }

  customElements.define("atrium-shell", AtriumShell);

  const mount = () => {
    if (!document.querySelector("atrium-shell")) {
      document.body.append(document.createElement("atrium-shell"));
    }
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
