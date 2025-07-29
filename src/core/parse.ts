/**
 * Safetensors parsing implementation
 */

import type {
  AnalysisOptions,
  RawMetadata,
  RawTensorInfo,
  SafetensorsHeader,
  TensorDataType,
} from "./schema";
import { zSafetensorsHeader } from "./schema";
import type {
  AnalysisError,
  AnalysisErrorResult,
  BaseModelVersion,
  FileStats,
  LoRAInfo,
  LoRATarget,
  ModelHashes,
  ModelSpecMetadata,
  ModelType,
  SafetensorsAnalysis,
  TensorInfo,
  TrainingMetadata,
} from "./types";

/**
 * Constants
 */
const HEADER_SIZE_BYTES = 8;
const MAX_HEADER_SIZE = 100 * 1024 * 1024; // 100MB limit

/**
 * Read header size from buffer
 */
export function readHeaderSize(buffer: ArrayBuffer): number {
  if (buffer.byteLength < HEADER_SIZE_BYTES) {
    throw new Error("Invalid safetensors file: too small");
  }

  const view = new DataView(buffer);
  // Read as little-endian 64-bit unsigned integer
  const low = view.getUint32(0, true);
  const high = view.getUint32(4, true);

  // For JavaScript, we need to handle 64-bit carefully
  const size = low + high * 0x100000000;

  if (size > MAX_HEADER_SIZE) {
    throw new Error(
      `Header size ${size} exceeds maximum allowed size ${MAX_HEADER_SIZE}`,
    );
  }

  return size;
}

/**
 * Parse safetensors header from buffer
 */
export function parseHeader(buffer: ArrayBuffer): SafetensorsHeader {
  const headerSize = readHeaderSize(buffer);

  if (buffer.byteLength < HEADER_SIZE_BYTES + headerSize) {
    throw new Error("Invalid safetensors file: incomplete header");
  }

  // Extract header JSON
  const headerBytes = new Uint8Array(buffer, HEADER_SIZE_BYTES, headerSize);
  const headerJson = new TextDecoder().decode(headerBytes);

  let data: any;
  try {
    data = JSON.parse(headerJson);
  } catch (e) {
    throw new Error(`Invalid header JSON: ${e}`);
  }

  // Validate header structure
  const result = zSafetensorsHeader.safeParse({
    size: headerSize,
    data,
  });

  if (!result.success) {
    throw new Error(`Invalid header structure: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Detect model type from tensor names and metadata
 */
export function detectModelType(
  tensorNames: string[],
  metadata?: RawMetadata,
): ModelType {
  // Check metadata first
  if (metadata?.["modelspec.architecture"]) {
    const arch = metadata["modelspec.architecture"].toLowerCase();
    if (arch.includes("/lora")) return "lora";
    if (arch.includes("vae")) return "vae";
    if (arch.includes("controlnet")) return "controlnet";
    if (arch.includes("text_encoder") || arch.includes("clip"))
      return "text_encoder";
  }

  // Analyze tensor names
  const hasLora = tensorNames.some(
    (name) =>
      name.includes("lora_") &&
      (name.includes(".alpha") ||
        name.includes(".lora_down") ||
        name.includes(".lora_up")),
  );
  if (hasLora) return "lora";

  const hasVAE = tensorNames.some(
    (name) => name.startsWith("decoder.") || name.startsWith("encoder."),
  );
  const hasUNet = tensorNames.some(
    (name) => name.includes("diffusion_model") || name.includes("unet"),
  );

  if (hasVAE && !hasUNet) return "vae";

  const hasControlNet = tensorNames.some(
    (name) =>
      name.includes("control_") ||
      (name.includes("input_blocks") && name.includes("zero_convs")),
  );
  if (hasControlNet) return "controlnet";

  const hasTextModel = tensorNames.some(
    (name) => name.includes("text_model") || name.includes("text_encoder"),
  );
  if (hasTextModel && !hasUNet) return "text_encoder";

  // Check for checkpoint patterns first (before embedding check)
  const hasCondStage = tensorNames.some((name) =>
    name.includes("cond_stage_model"),
  );
  const hasFirstStage = tensorNames.some((name) =>
    name.includes("first_stage_model"),
  );
  if (hasUNet && (hasCondStage || hasFirstStage || hasTextModel))
    return "checkpoint";

  const hasEmbedding =
    tensorNames.length <= 5 &&
    tensorNames.some((name) => name.includes("emb") || name === "weight");
  if (hasEmbedding) return "embedding";

  if (hasUNet) return "diffusion_model";

  return "unknown";
}

/**
 * Extract LoRA targets from tensor names
 */
export function extractLoRATargets(tensorNames: string[]): LoRATarget[] {
  const targets = new Set<LoRATarget>();

  for (const name of tensorNames) {
    if (name.startsWith("lora_te1_")) targets.add("CLIP-L");
    else if (name.startsWith("lora_te2_")) targets.add("CLIP-G");
    else if (name.startsWith("lora_unet_")) targets.add("UNet");
  }

  return Array.from(targets);
}

/**
 * Extract trigger words from tag frequency
 */
export function extractTriggerWords(
  tagFrequency: string | undefined,
  maxWords: number = 5,
): string[] {
  if (!tagFrequency) return [];

  try {
    const parsed = JSON.parse(tagFrequency);
    const allTags: Record<string, number> = {};

    // Merge all tag frequencies
    for (const category of Object.values(parsed)) {
      if (typeof category === "object" && category !== null) {
        Object.assign(allTags, category);
      }
    }

    // Sort by frequency and return top words
    return Object.entries(allTags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxWords)
      .map(([tag]) => tag);
  } catch {
    return [];
  }
}

/**
 * Parse metadata fields
 */
export function parseMetadata(raw: RawMetadata): {
  modelSpec: ModelSpecMetadata;
  training: TrainingMetadata;
  hashes: ModelHashes;
} {
  const modelSpec: ModelSpecMetadata = {};
  const training: TrainingMetadata = {};
  const hashes: ModelHashes = {};

  for (const [key, value] of Object.entries(raw)) {
    // Model spec fields
    if (key.startsWith("modelspec.")) {
      const field = key.substring(10);
      switch (field) {
        case "sai_model_spec":
        case "architecture":
        case "implementation":
        case "title":
        case "description":
        case "author":
        case "date":
        case "resolution":
        case "prediction_type":
        case "encoder_layer":
          modelSpec[field as keyof ModelSpecMetadata] = value;
          break;
      }
    }

    // Hash fields (check these first before general ss_ handling)
    else if (key === "sshs_model_hash") {
      hashes.model_hash = value;
    } else if (key === "sshs_legacy_hash") {
      hashes.legacy_hash = value;
    } else if (key === "ss_sd_model_hash") {
      hashes.sd_model_hash = value;
    } else if (key === "ss_new_sd_model_hash") {
      hashes.new_sd_model_hash = value;
    }

    // Training fields
    else if (key.startsWith("ss_")) {
      const field = key.substring(3);
      switch (field) {
        case "base_model_version":
          training.base_model_version = value as BaseModelVersion;
          break;
        case "num_train_images":
        case "num_epochs":
        case "network_dim":
        case "network_alpha":
        case "clip_skip":
          const intValue = parseInt(value);
          if (!isNaN(intValue)) {
            training[field as keyof TrainingMetadata] = intValue as any;
          }
          break;
        case "learning_rate":
        case "noise_offset":
        case "caption_dropout_rate":
          const floatValue = parseFloat(value);
          if (!isNaN(floatValue)) {
            training[field as keyof TrainingMetadata] = floatValue as any;
          }
          break;
        case "gradient_checkpointing":
          training.gradient_checkpointing = value === "True";
          break;
        case "dataset_dirs":
          try {
            training.dataset_dirs = JSON.parse(value);
          } catch {}
          break;
        case "tag_frequency":
          try {
            training.tag_frequency = JSON.parse(value);
          } catch {}
          break;
        case "optimizer":
        case "lr_scheduler":
        case "training_started_at":
        case "training_finished_at":
        case "mixed_precision":
          (training as any)[field] = value;
          break;
      }
    }
  }

  return { modelSpec, training, hashes };
}

/**
 * Calculate tensor statistics
 */
export function calculateTensorStats(
  tensors: Array<RawTensorInfo & { name: string }>,
): Pick<
  FileStats,
  "tensor_count" | "total_parameters" | "data_types" | "dtype_distribution"
> {
  const dataTypes = new Set<TensorDataType>();
  const dtypeDistribution: Record<TensorDataType, number> = {} as any;
  let totalParameters = 0;

  for (const tensor of tensors) {
    dataTypes.add(tensor.dtype);
    dtypeDistribution[tensor.dtype] =
      (dtypeDistribution[tensor.dtype] || 0) + 1;

    // Calculate parameters
    const params = tensor.shape.reduce((a, b) => a * b, 1);
    totalParameters += params;
  }

  return {
    tensor_count: tensors.length,
    total_parameters: totalParameters,
    data_types: Array.from(dataTypes),
    dtype_distribution: dtypeDistribution,
  };
}

/**
 * Main analysis function
 */
export function analyzeSafetensors(
  header: SafetensorsHeader,
  fileSize: number,
  options: AnalysisOptions = {},
): SafetensorsAnalysis {
  const warnings: string[] = [];

  // Extract metadata and tensors
  const metadata = (header.data.__metadata__ as RawMetadata) || {};
  const tensors: Array<RawTensorInfo & { name: string }> = [];

  for (const [key, value] of Object.entries(header.data)) {
    if (
      key !== "__metadata__" &&
      typeof value === "object" &&
      value &&
      "dtype" in value
    ) {
      const tensorInfo = value as RawTensorInfo;
      tensors.push({ name: key, ...tensorInfo });
    }
  }

  // Detect model type
  const tensorNames = tensors.map((t) => t.name);
  const modelType = detectModelType(tensorNames, metadata);

  // Parse metadata
  const { modelSpec, training, hashes } = parseMetadata(metadata);

  // Calculate stats
  const tensorStats = calculateTensorStats(tensors);

  // Build tensor info list
  let tensorInfos: TensorInfo[] = [];
  if (options.include_tensors !== false) {
    const limit = options.max_tensors || tensors.length;
    tensorInfos = tensors.slice(0, limit).map((tensor) => {
      const params = tensor.shape.reduce((a, b) => a * b, 1);
      const size = tensor.data_offsets[1] - tensor.data_offsets[0];

      return {
        name: tensor.name,
        dtype: tensor.dtype,
        shape: tensor.shape,
        data_offsets: tensor.data_offsets,
        size,
        parameters: params,
      };
    });

    if (tensors.length > limit) {
      warnings.push(`Tensor list truncated to ${limit} items`);
    }
  }

  // Build LoRA info if applicable
  let loraInfo: LoRAInfo | undefined;
  if (modelType === "lora") {
    const triggerWords =
      options.extract_trigger_words !== false
        ? extractTriggerWords(
            training.tag_frequency
              ? JSON.stringify(training.tag_frequency)
              : undefined,
            options.max_trigger_words,
          )
        : [];

    loraInfo = {
      base_model: training.base_model_version || null,
      target_components: extractLoRATargets(tensorNames),
      rank: training.network_dim || null,
      alpha: training.network_alpha || null,
      trigger_words: triggerWords,
      module: metadata.ss_network_module,
    };
  }

  // Detect compatibility
  const compatibility = {
    pytorch:
      metadata.format === "pt" || tensorNames.some((n) => n.includes("weight")),
    tensorflow: metadata.format === "tf",
    jax: metadata.format === "jax",
    numpy: metadata.format === "numpy",
  };

  return {
    model_type: modelType,
    file_stats: {
      file_size: fileSize,
      header_size: header.size,
      ...tensorStats,
    },
    raw_metadata: metadata,
    model_spec: modelSpec,
    training,
    hashes,
    lora_info: loraInfo,
    tensors: tensorInfos,
    compatibility,
    warnings,
  };
}

/**
 * Create an error result
 */
export function createErrorResult(
  error: AnalysisError,
  message: string,
  details?: any,
): AnalysisErrorResult {
  return { error, message, details };
}
