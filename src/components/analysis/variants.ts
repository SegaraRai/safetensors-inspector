export const getDtypeVariant = (dtype: string) => {
  switch (dtype) {
    case "BOOL":
      return "error";
    case "F32":
      return "primary";
    case "F16":
      return "secondary";
    case "BF16":
      return "accent";
    case "F64":
      return "primary";
    case "F8_E5M2":
    case "F8_E4M3":
      return "secondary";
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

export const getLoraTargetVariant = (target: string) => {
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

export const getModelVariant = (modelType: string) => {
  switch (modelType) {
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

export const getModelDisplayName = (modelType: string) => {
  switch (modelType) {
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
