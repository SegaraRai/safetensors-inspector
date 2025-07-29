import { For, type Component } from "solid-js";
import type { FileStats } from "../../core/types";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Stats from "../ui/Stats";
import { formatFileSize, formatNumber } from "./format";
import { getDtypeVariant } from "./variants";

interface FileStatsDisplayProps {
  fileStats: FileStats;
  class?: string;
}

const FileStatsDisplay: Component<FileStatsDisplayProps> = (props) => {
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
                    {props.fileStats.dtype_distribution[dtype].toLocaleString()}
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
