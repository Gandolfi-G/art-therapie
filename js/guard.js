import { buildLoginUrl, getCurrentPageWithQuery, hasAccess } from "./auth.js";

if (!hasAccess()) {
  window.location.replace(buildLoginUrl(getCurrentPageWithQuery()));
} else {
  document.body.classList.remove("auth-pending");
  document.body.classList.add("auth-ready");
}
