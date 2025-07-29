import type { Component } from "solid-js";
import type { ModelType } from "../../core/types";
import Badge from "../ui/Badge";

interface ModelTypeDisplayProps {
  modelType: ModelType;
  class?: string;
}

const ModelTypeDisplay: Component<ModelTypeDisplayProps> = (props) => {
  const getVariant = () => {
    switch (props.modelType) {
      case "checkpoint":
        return "primary";
      case "lora":
        return "secondary";
      case "vae":
        return "accent";
      case "controlnet":
        return "success";
      case "text_encoder":
        return "warning";
      case "embedding":
        return "neutral";
      case "diffusion_model":
        return "primary";
      case "unknown":
      default:
        return "error";
    }
  };

  const getDisplayName = () => {
    switch (props.modelType) {
      case "checkpoint":
        return "Checkpoint";
      case "lora":
        return "LoRA";
      case "vae":
        return "VAE";
      case "controlnet":
        return "ControlNet";
      case "text_encoder":
        return "Text Encoder";
      case "embedding":
        return "Embedding";
      case "diffusion_model":
        return "Diffusion Model";
      case "unknown":
      default:
        return "Unknown";
    }
  };

  return (
    <Badge variant={getVariant()} size="lg" class={props.class}>
      {getDisplayName()}
    </Badge>
  );
};

export default ModelTypeDisplay;
