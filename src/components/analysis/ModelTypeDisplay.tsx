import type { Component } from "solid-js";
import type { ModelType } from "../../core/types";
import Badge from "../ui/Badge";
import { getModelDisplayName, getModelVariant } from "./variants";

interface ModelTypeDisplayProps {
  modelType: ModelType;
  class?: string;
}

const ModelTypeDisplay: Component<ModelTypeDisplayProps> = (props) => {
  return (
    <Badge
      variant={getModelVariant(props.modelType)}
      size="lg"
      class={props.class}
    >
      {getModelDisplayName(props.modelType)}
    </Badge>
  );
};

export default ModelTypeDisplay;
