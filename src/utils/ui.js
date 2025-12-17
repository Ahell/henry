// Dev-safe alert wrapper: logs as warning in dev, shows native alert in prod
export function showAlert(msg) {
  const isDev =
    typeof import.meta !== "undefined"
      ? Boolean(import.meta.env && import.meta.env.DEV)
      : typeof window !== "undefined" &&
        window.location &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
  if (isDev) {
    console.warn("ALERT suppressed in dev:", msg);
  } else {
    alert(msg);
  }
}
