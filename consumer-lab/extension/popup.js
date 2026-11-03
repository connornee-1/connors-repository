const status = document.getElementById("status");
document.getElementById("approve").addEventListener("click", async () => {
  try {
    const granted = await chrome.permissions.request({
      permissions: ["history"],
    });
    status.textContent = granted
      ? "Approved. Open the dashboard, choose a period, then analyze."
      : "Permission declined. Nothing was read.";
  } catch {
    status.textContent =
      "Permission request failed. Try again from this popup.";
  }
});
document.getElementById("revoke").addEventListener("click", async () => {
  await chrome.permissions.remove({ permissions: ["history"] });
  status.textContent =
    "Permission revoked. Delete session records in the dashboard or reload it to clear transferred data.";
});
