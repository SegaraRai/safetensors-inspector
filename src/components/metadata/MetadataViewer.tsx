import { createSignal, For, Show, type Component } from "solid-js";
import type {
  ModelHashes,
  ModelSpecMetadata,
  RawMetadata,
  TrainingMetadata,
} from "../../core/types";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

interface MetadataViewerProps {
  rawMetadata: RawMetadata;
  modelSpec: ModelSpecMetadata;
  training: TrainingMetadata;
  hashes: ModelHashes;
  class?: string;
}

const MetadataViewer: Component<MetadataViewerProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<
    "modelspec" | "training" | "hashes" | "raw"
  >("modelspec");

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const TabButton: Component<{
    tab: string;
    label: string;
    active: boolean;
  }> = (tabProps) => (
    <button
      class={`tab tab-bordered ${tabProps.active ? "tab-active" : ""}`}
      onClick={() => setActiveTab(tabProps.tab as any)}
    >
      {tabProps.label}
    </button>
  );

  const MetadataSection: Component<{
    data: Record<string, any>;
    title: string;
  }> = (sectionProps) => (
    <Show
      when={Object.keys(sectionProps.data).length > 0}
      fallback={
        <div class="text-center py-8 text-base-content/60">
          No {sectionProps.title.toLowerCase()} metadata available
        </div>
      }
    >
      <div class="space-y-3">
        <For each={Object.entries(sectionProps.data)}>
          {([key, value]) => (
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-base-300 last:border-b-0">
              <div class="font-semibold text-sm text-base-content/70 break-words">
                {key}
              </div>
              <div class="md:col-span-2 font-mono text-sm break-all">
                <Show
                  when={typeof value === "string" && value.length < 100}
                  fallback={
                    <pre class="whitespace-pre-wrap text-xs bg-base-200 p-2 rounded max-h-32 overflow-y-auto">
                      {formatValue(value)}
                    </pre>
                  }
                >
                  {formatValue(value)}
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </Show>
  );

  return (
    <Card title="Metadata" class={props.class} bordered shadow>
      <div class="space-y-4">
        <div class="tabs tabs-border w-full">
          <TabButton
            tab="modelspec"
            label="Model Spec"
            active={activeTab() === "modelspec"}
          />
          <TabButton
            tab="training"
            label="Training"
            active={activeTab() === "training"}
          />
          <TabButton
            tab="hashes"
            label="Hashes"
            active={activeTab() === "hashes"}
          />
          <TabButton tab="raw" label="Raw" active={activeTab() === "raw"} />
        </div>

        <div class="min-h-[200px]">
          <Show when={activeTab() === "modelspec"}>
            <MetadataSection data={props.modelSpec} title="Model Spec" />
          </Show>

          <Show when={activeTab() === "training"}>
            <MetadataSection data={props.training} title="Training" />
          </Show>

          <Show when={activeTab() === "hashes"}>
            <MetadataSection data={props.hashes} title="Hashes" />
          </Show>

          <Show when={activeTab() === "raw"}>
            <div class="space-y-3">
              <Show when={Object.keys(props.rawMetadata).length > 0}>
                <Badge variant="neutral" size="sm">
                  {Object.keys(props.rawMetadata).length} fields
                </Badge>
              </Show>
              <MetadataSection data={props.rawMetadata} title="Raw" />
            </div>
          </Show>
        </div>
      </div>
    </Card>
  );
};

export default MetadataViewer;
