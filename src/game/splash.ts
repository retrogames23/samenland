/** Whether the parchment splash has already finished in this tab session
 * (survives a login redirect or refresh — sprites are cached by then). */
const KEY = "samenland-splash-done";
let shown = false;
export const splashDone = () => {
  if (!shown && typeof sessionStorage !== "undefined") {
    try { shown = sessionStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
  }
  return shown;
};
export const markSplashDone = () => {
  shown = true;
  try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
};
