import type { Component } from "solid-js";
import type { TensorInfo } from "../../core/types";
import Badge from "../ui/Badge";
import Table from "../ui/Table";

interface TensorListTableProps {
  tensors: TensorInfo[];
  class?: string;
}

const TensorListTable: Component<TensorListTableProps> = (props) => {
  const formatSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  const formatShape = (shape: number[]) => {
    return `[${shape.join(", ")}]`;
  };

  const formatParameters = (params: number) => {
    if (params >= 1_000_000) {
      return `${(params / 1_000_000).toFixed(1)}M`;
    } else if (params >= 1_000) {
      return `${(params / 1_000).toFixed(1)}K`;
    }
    return params.toString();
  };

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

  const columns = [
    {
      key: "name" as keyof TensorInfo,
      title: "Name",
      width: "25%",
      render: (value: any) => (
        <span class="font-mono text-sm truncate max-w-xs" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: "dtype" as keyof TensorInfo,
      title: "Data Type",
      width: "12%",
      align: "center" as const,
      render: (value: any) => (
        <Badge variant={getDtypeVariant(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: "shape" as keyof TensorInfo,
      title: "Shape",
      width: "20%",
      align: "center" as const,
      render: (value: any) => (
        <span class="font-mono text-sm">{formatShape(value)}</span>
      ),
    },
    {
      key: "parameters" as keyof TensorInfo,
      title: "Parameters",
      width: "15%",
      align: "right" as const,
      render: (value: any) => (
        <span class="font-mono text-sm">{formatParameters(value)}</span>
      ),
    },
    {
      key: "size" as keyof TensorInfo,
      title: "Size",
      width: "12%",
      align: "right" as const,
      render: (value: any) => (
        <span class="font-mono text-sm">{formatSize(value)}</span>
      ),
    },
    {
      key: "data_offsets" as keyof TensorInfo,
      title: "Offsets",
      width: "16%",
      align: "center" as const,
      render: (value: any) => (
        <span class="font-mono text-xs text-base-content/60">
          {value[0]}-{value[1]}
        </span>
      ),
    },
  ];

  return (
    <Table
      data={props.tensors}
      columns={columns}
      class={props.class}
      zebra
      hoverable
      compact
      emptyMessage="No tensors found"
    />
  );
};

export default TensorListTable;
