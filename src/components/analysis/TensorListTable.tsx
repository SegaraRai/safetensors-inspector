import type { Component } from "solid-js";
import type { TensorInfo } from "../../core/types";
import Badge from "../ui/Badge";
import Table from "../ui/Table";
import { formatFileSize, formatParameters, formatShape } from "./format";
import { getDtypeVariant } from "./variants";

interface TensorListTableProps {
  tensors: TensorInfo[];
  class?: string;
}

const TensorListTable: Component<TensorListTableProps> = (props) => {
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
        <span class="font-mono text-sm whitespace-nowrap">
          {formatShape(value)}
        </span>
      ),
    },
    {
      key: "parameters" as keyof TensorInfo,
      title: "Parameters",
      width: "15%",
      align: "right" as const,
      render: (value: any) => (
        <span class="font-mono text-sm whitespace-nowrap">
          {formatParameters(value)}
        </span>
      ),
    },
    {
      key: "size" as keyof TensorInfo,
      title: "Size",
      width: "12%",
      align: "right" as const,
      render: (value: any) => (
        <span class="font-mono text-sm whitespace-nowrap">
          {formatFileSize(value)}
        </span>
      ),
    },
    {
      key: "data_offsets" as keyof TensorInfo,
      title: "Offsets",
      width: "16%",
      align: "center" as const,
      render: (value: any) => (
        <span class="font-mono text-xs text-base-content/60 whitespace-nowrap">
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
