/** Whether the parchment splash has already finished on this page view. */
let shown = false;
export const splashDone = () => shown;
export const markSplashDone = () => { shown = true; };
