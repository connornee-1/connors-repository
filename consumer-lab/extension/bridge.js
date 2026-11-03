const allowed =
  location.origin === "https://connornee-1.github.io" &&
  location.pathname.startsWith("/connors-repository/consumer-lab/");
if (allowed) {
  const emit = (m) =>
    window.postMessage({ channel: "orbit-extension", ...m }, location.origin);
  let pending = false;
  window.addEventListener("message", async (e) => {
    if (
      e.source !== window ||
      e.origin !== location.origin ||
      e.data?.channel !== "orbit-dashboard"
    )
      return;
    const m = e.data;
    if (m.type === "PING") {
      emit({ type: "READY" });
      return;
    }
    if (
      !["HISTORY", "REVOKE"].includes(m.type) ||
      typeof m.id !== "string" ||
      m.id.length > 80 ||
      pending
    )
      return;
    pending = true;
    try {
      const result = await chrome.runtime.sendMessage({
        type: m.type,
        days: m.days,
      });
      emit({ ...result, id: m.id });
    } catch {
      emit({
        type: "RESULT",
        id: m.id,
        error: "Extension unavailable. Reload the dashboard.",
      });
    } finally {
      pending = false;
    }
  });
  emit({ type: "READY" });
}
