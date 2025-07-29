import { For, type Component } from "solid-js";
import type { FileStats } from "../../core/types";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Stats from "../ui/Stats";

interface FileStatsDisplayProps {
  fileStats: FileStats;
  class?: string;
}

const FileStatsDisplay: Component<FileStatsDisplayProps> = (props) => {
  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const mainStats = () => [
    {
      title: "File Size",
      value: formatFileSize(props.fileStats.file_size),
      desc: `${props.fileStats.file_size.toLocaleString()} bytes`,
    },
    {
      title: "Header Size",
      value: formatFileSize(props.fileStats.header_size),
      desc: `${props.fileStats.header_size.toLocaleString()} bytes`,
    },
    {
      title: "Tensors",
      value: props.fileStats.tensor_count.toLocaleString(),
      desc: "Total tensor count",
    },
    {
      title: "Parameters",
      value: formatNumber(props.fileStats.total_parameters),
      desc: `${props.fileStats.total_parameters.toLocaleString()} total`,
    },
  ];

  const getDtypeVariant = (dtype: string) => {
    switch (dtype) {
      case "F32":
        return "primary";
      case "F16":
        return "secondary";
      case "BF16":
        return "accent";
      case "I8":
      case "I16":
      case "I32":
      case "I64":
        return "warning";
      case "U8":
      case "U16":
      case "U32":
      case "U64":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <Card title="File Statistics" class={props.class} bordered shadow>
      <div class="space-y-6">
        <Stats items={mainStats()} />

        <div>
          <h4 class="font-semibold text-sm text-base-content/70 mb-3">
            Data Types
          </h4>
          <div class="flex flex-wrap gap-2">
            <For each={props.fileStats.data_types}>
              {(dtype) => (
                <div class="flex items-center gap-2">
                  <Badge variant={getDtypeVariant(dtype)} size="sm">
                    {dtype}
                  </Badge>
                  <span class="text-xs text-base-content/60">
                    {props.fileStats.dtype_distribution[dtype]}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FileStatsDisplay;
