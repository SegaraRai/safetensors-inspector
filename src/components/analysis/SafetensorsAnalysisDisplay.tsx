import { For, Show, type Component } from "solid-js";
import type { SafetensorsAnalysis } from "../../core/types";
import MetadataViewer from "../metadata/MetadataViewer";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import FileStatsDisplay from "./FileStatsDisplay";
import LoRAInfoDisplay from "./LoRAInfoDisplay";
import ModelTypeDisplay from "./ModelTypeDisplay";
import TensorListTable from "./TensorListTable";

interface SafetensorsAnalysisDisplayProps {
  analysis: SafetensorsAnalysis;
  class?: string;
}

const SafetensorsAnalysisDisplay: Component<SafetensorsAnalysisDisplayProps> = (
  props,
) => {
  const getCompatibilityBadges = () => {
    const badges = [];
    if (props.analysis.compatibility.pytorch)
      badges.push({ label: "PyTorch", variant: "success" as const });
    if (props.analysis.compatibility.tensorflow)
      badges.push({ label: "TensorFlow", variant: "success" as const });
    if (props.analysis.compatibility.jax)
      badges.push({ label: "JAX", variant: "success" as const });
    if (props.analysis.compatibility.numpy)
      badges.push({ label: "NumPy", variant: "success" as const });

    if (badges.length === 0) {
      badges.push({ label: "Unknown", variant: "neutral" as const });
    }

    return badges;
  };

  return (
    <div class={`space-y-6 ${props.class || ""}`}>
      {/* Header Section */}
      <Card title="Model Analysis" bordered shadow>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-4">
            <ModelTypeDisplay modelType={props.analysis.model_type} />
            <div class="text-sm text-base-content/60">
              Analyzed safetensors model
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <div class="text-xs text-base-content/50 mr-2">
              Compatible with:
            </div>
            <For each={getCompatibilityBadges()}>
              {(badge) => (
                <Badge variant={badge.variant} size="xs">
                  {badge.label}
                </Badge>
              )}
            </For>
          </div>
        </div>

        <Show when={props.analysis.warnings.length > 0}>
          <div class="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <Badge variant="warning" size="sm">
                Warnings
              </Badge>
            </div>
            <For each={props.analysis.warnings}>
              {(warning) => (
                <div class="text-sm text-warning-content/80 mb-1 last:mb-0">
                  • {warning}
                </div>
              )}
            </For>
          </div>
        </Show>
      </Card>

      {/* LoRA Information (if applicable) */}
      <Show when={props.analysis.lora_info}>
        <LoRAInfoDisplay loraInfo={props.analysis.lora_info!} />
      </Show>

      {/* File Statistics */}
      <FileStatsDisplay fileStats={props.analysis.file_stats} />

      {/* Tensors Table */}
      <Show when={props.analysis.tensors.length > 0}>
        <Card title="Tensors" bordered shadow>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-sm text-base-content/60">
                Showing {props.analysis.tensors.length} tensors
              </div>
            </div>
            <TensorListTable tensors={props.analysis.tensors} />
          </div>
        </Card>
      </Show>

      {/* Metadata Viewer */}
      <MetadataViewer
        rawMetadata={props.analysis.raw_metadata}
        modelSpec={props.analysis.model_spec}
        training={props.analysis.training}
        hashes={props.analysis.hashes}
      />
    </div>
  );
};

export default SafetensorsAnalysisDisplay;
