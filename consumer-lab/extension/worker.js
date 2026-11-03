export function authorized(sender) {
  try {
    const u = new URL(sender.url);
    return (
      sender.id === chrome.runtime.id &&
      u.origin === "https://connornee-1.github.io" &&
      u.pathname.startsWith("/connors-repository/consumer-lab/") &&
      sender.frameId === 0
    );
  } catch {
    return false;
  }
}
export async function handle(message, sender) {
  if (!authorized(sender))
    return { type: "RESULT", error: "Unauthorized dashboard." };
  if (message.type === "REVOKE") {
    await chrome.permissions.remove({ permissions: ["history"] });
    return { type: "REVOKED" };
  }
  if (message.type !== "HISTORY" || ![7, 30, 90].includes(message.days))
    return { type: "RESULT", error: "Invalid request." };
  if (!(await chrome.permissions.contains({ permissions: ["history"] })))
    return {
      type: "RESULT",
      error:
        "Open the Orbit extension popup and approve history permission, then try again.",
    };
  const end = Date.now(),
    start = end - message.days * 86400000;
  const items = await chrome.history.search({
    text: "",
    startTime: start,
    endTime: end,
    maxResults: 5000,
  });
  const records = [];
  for (let i = 0; i < items.length; i += 20) {
    const batches = await Promise.all(
      items.slice(i, i + 20).map(async (item) => {
        if (!item.url || !/^https?:\/\//.test(item.url)) return [];
        const u = new URL(item.url);
        if (u.username || u.password) return [];
        u.search = "";
        u.hash = "";
        const visits = await chrome.history.getVisits({ url: item.url });
        return visits
          .filter((v) => v.visitTime >= start && v.visitTime <= end)
          .map((v) => ({
            url: u.href,
            title: item.title || "",
            time: v.visitTime,
          }));
      }),
    );
    records.push(...batches.flat());
    if (records.length >= 100000)
      return {
        type: "RESULT",
        records: records.slice(0, 100000),
        truncated: true,
      };
  }
  return { type: "RESULT", records, truncated: items.length === 5000 };
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  handle(message, sender)
    .then(respond)
    .catch(() =>
      respond({
        type: "RESULT",
        error:
          "History read failed or permission was revoked. No records transferred.",
      }),
    );
  return true;
});
