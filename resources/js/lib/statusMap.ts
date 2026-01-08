import statusMap from "../../shared/statuses.json";

export type StatusKey = keyof typeof statusMap;

export const getStatusVariant = (status: StatusKey) =>
  statusMap[status]?.reactVariant ?? "secondary";

export const getStatusTextClass = (status: StatusKey) =>
  statusMap[status]?.reactText ?? "text-brand-neutral";

export const getStatusSoftClass = (status: StatusKey) =>
  statusMap[status]?.reactSoft ?? "bg-brand-neutral/10 text-brand-neutral border-brand-neutral/20";

export const getStatusOutlineClass = (status: StatusKey) =>
  statusMap[status]?.reactOutline ?? "text-brand-neutral border-brand-neutral/40";
