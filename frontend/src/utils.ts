export function getStatusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "paid":
    case "succeeded":
      return "badge badge-success";
    case "open":
    case "pending":
    case "grace_period":
      return "badge badge-warning";
    case "failed":
    case "cancelled":
    case "canceled":
    case "past_due":
    case "canceled_auto":
      return "badge badge-error";
    default:
      return "badge badge-neutral";
  }
}

export function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
