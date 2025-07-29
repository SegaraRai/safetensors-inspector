export const formatFileSize = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

export const formatNumber = (num: number) => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

export const formatParameters = (params: number) => {
  if (params >= 1_000_000) {
    return `${(params / 1_000_000).toFixed(1)}M`;
  } else if (params >= 1_000) {
    return `${(params / 1_000).toFixed(1)}K`;
  }
  return params.toString();
};

export const formatShape = (shape: number[]) => {
  return `[${shape.join(", ")}]`;
};
