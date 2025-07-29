import { createSignal, For, Show, type Component } from "solid-js";
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
  const [currentPage, setCurrentPage] = createSignal(1);
  const tensorsPerPage = 50;
  const [showAllTensors, setShowAllTensors] = createSignal(false);

  const totalPages = () =>
    Math.ceil(props.analysis.tensors.length / tensorsPerPage);

  const displayedTensors = () => {
    if (showAllTensors()) {
      return props.analysis.tensors;
    }
    const start = (currentPage() - 1) * tensorsPerPage;
    const end = start + tensorsPerPage;
    return props.analysis.tensors.slice(start, end);
  };

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
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="text-sm text-base-content/60">
                {showAllTensors()
                  ? `Showing all ${props.analysis.tensors.length} tensors`
                  : `Showing ${displayedTensors().length} of ${props.analysis.tensors.length} tensors (Page ${currentPage()} of ${totalPages()})`}
              </div>

              <div class="flex items-center gap-4">
                <Show when={props.analysis.tensors.length > tensorsPerPage}>
                  <button
                    class={`btn btn-sm ${showAllTensors() ? "btn-outline" : "btn-primary"}`}
                    onClick={() => setShowAllTensors(!showAllTensors())}
                  >
                    {showAllTensors() ? "Show Pages" : "Show All"}
                  </button>
                </Show>

                <Show when={!showAllTensors() && totalPages() > 1}>
                  <div class="join">
                    <button
                      class="join-item btn btn-sm"
                      aria-label="Previous Page"
                      disabled={currentPage() === 1}
                      onClick={() => setCurrentPage(currentPage() - 1)}
                    >
                      <span class="icon-[jam--chevron-left]"></span>
                    </button>
                    <span class="join-item btn btn-sm btn-active inline-flex items-center justify-center min-w-10 [font-feature-settings:'tnum'] pointer-events-none">
                      {currentPage()}
                    </span>
                    <button
                      class="join-item btn btn-sm"
                      aria-label="Next Page"
                      disabled={currentPage() === totalPages()}
                      onClick={() => setCurrentPage(currentPage() + 1)}
                    >
                      <span class="icon-[jam--chevron-right]"></span>
                    </button>
                  </div>
                </Show>
              </div>
            </div>

            <div class={showAllTensors() ? "max-h-96 overflow-y-auto" : ""}>
              <TensorListTable tensors={displayedTensors()} />
            </div>

            <Show when={!showAllTensors() && totalPages() > 1}>
              <div class="flex justify-center">
                <div class="join">
                  <button
                    class="join-item btn btn-sm"
                    disabled={currentPage() === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    First
                  </button>
                  <button
                    class="join-item btn btn-sm"
                    disabled={currentPage() === 1}
                    onClick={() => setCurrentPage(currentPage() - 1)}
                  >
                    Previous
                  </button>
                  <span class="join-item btn btn-sm btn-active [font-feature-settings:'tnum'] pointer-events-none">
                    Page {currentPage()} of {totalPages()}
                  </span>
                  <button
                    class="join-item btn btn-sm"
                    disabled={currentPage() === totalPages()}
                    onClick={() => setCurrentPage(currentPage() + 1)}
                  >
                    Next
                  </button>
                  <button
                    class="join-item btn btn-sm"
                    disabled={currentPage() === totalPages()}
                    onClick={() => setCurrentPage(totalPages())}
                  >
                    Last
                  </button>
                </div>
              </div>
            </Show>
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
