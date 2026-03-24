import { grantAccess, hasAccess, sanitizeNext, verifyPassword } from "./auth.js";

const form = document.querySelector("#login-form");
const errorBox = document.querySelector("#login-error");
const passwordInput = document.querySelector("#password");
const rememberInput = document.querySelector("#remember");
const submitButton = document.querySelector("#submit-button");

const params = new URLSearchParams(window.location.search);
const nextPage = sanitizeNext(params.get("next"));

function goNext() {
  window.location.replace(`./${nextPage}`);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

if (hasAccess()) {
  goNext();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const password = passwordInput.value;
  if (!password) {
    showError("Veuillez saisir votre mot de passe.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Vérification...";

  try {
    const valid = await verifyPassword(password);
    if (!valid) {
      showError("Mot de passe incorrect. Veuillez réessayer.");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    grantAccess({ remember: Boolean(rememberInput.checked) });
    goNext();
  } catch {
    showError("Impossible de vérifier l'accès dans ce navigateur.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Entrer";
  }
});
