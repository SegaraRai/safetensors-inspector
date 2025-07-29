import { For, Show, type Component } from "solid-js";
import type { LoRAInfo } from "../../core/types";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import Stats from "../ui/Stats";

interface LoRAInfoDisplayProps {
  loraInfo: LoRAInfo;
  class?: string;
}

const LoRAInfoDisplay: Component<LoRAInfoDisplayProps> = (props) => {
  const getTargetVariant = (target: string) => {
    switch (target) {
      case "UNet":
        return "primary";
      case "CLIP-L":
        return "secondary";
      case "CLIP-G":
        return "accent";
      default:
        return "neutral";
    }
  };

  const statsItems = () => [
    {
      title: "Rank",
      value: props.loraInfo.rank?.toString() || "N/A",
      desc: "Network dimension",
    },
    {
      title: "Alpha",
      value: props.loraInfo.alpha?.toString() || "N/A",
      desc: "Network alpha value",
    },
    {
      title: "Module",
      value: props.loraInfo.module || "N/A",
      desc: "Network module type",
    },
  ];

  return (
    <Card title="LoRA Information" class={props.class} bordered shadow>
      <div class="space-y-4">
        <Show when={props.loraInfo.base_model}>
          <div>
            <h4 class="font-semibold text-sm text-base-content/70 mb-2">
              Base Model
            </h4>
            <Badge variant="neutral" size="lg">
              {props.loraInfo.base_model}
            </Badge>
          </div>
        </Show>

        <Show when={props.loraInfo.target_components.length > 0}>
          <div>
            <h4 class="font-semibold text-sm text-base-content/70 mb-2">
              Target Components
            </h4>
            <div class="flex flex-wrap gap-2">
              <For each={props.loraInfo.target_components}>
                {(target) => (
                  <Badge variant={getTargetVariant(target)} size="md">
                    {target}
                  </Badge>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Stats items={statsItems()} />

        <Show when={props.loraInfo.trigger_words.length > 0}>
          <div>
            <h4 class="font-semibold text-sm text-base-content/70 mb-2">
              Trigger Words
            </h4>
            <div class="flex flex-wrap gap-2">
              <For each={props.loraInfo.trigger_words}>
                {(word) => (
                  <Badge variant="success" size="sm">
                    {word}
                  </Badge>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </Card>
  );
};

export default LoRAInfoDisplay;
