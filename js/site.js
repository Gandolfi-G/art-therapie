import { clearAccess, hasAccess } from "./auth.js";

function initLogout() {
  const buttons = [...document.querySelectorAll("#logout-button")];
  if (buttons.length === 0) {
    return;
  }

  const visible = hasAccess();
  for (const button of buttons) {
    button.classList.toggle("hidden", !visible);
    button.addEventListener("click", () => {
      clearAccess();
      window.location.href = "./index.html";
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initLogout();
});
