/**
 * Type definitions for Safetensors parsing results (output)
 * This file contains types for the analysis results, using input types from schema.ts
 */

import type { RawMetadata, TensorDataType } from "./schema";

/**
 * Model types that can be identified from safetensors files
 */
export type ModelType =
  | "checkpoint"
  | "lora"
  | "vae"
  | "controlnet"
  | "text_encoder"
  | "embedding"
  | "diffusion_model"
  | "unknown";

/**
 * LoRA target components
 */
export type LoRATarget = "UNet" | "CLIP-L" | "CLIP-G";

/**
 * Base model architectures
 */
export type BaseModelVersion =
  | "sd_v1-5"
  | "sd_v2-0"
  | "sd_v2-1"
  | "sdxl_base_v0-9"
  | "sdxl_base_v1-0"
  | string; // Allow custom versions

/**
 * Enhanced tensor information (parsed from raw tensor info)
 */
export interface TensorInfo {
  /** Tensor name/path */
  name: string;
  /** Data type */
  dtype: TensorDataType;
  /** Tensor shape dimensions */
  shape: number[];
  /** Byte offsets [start, end] in the file */
  data_offsets: [number, number];
  /** Calculated size in bytes */
  size: number;
  /** Total number of parameters */
  parameters: number;
}

/**
 * Parsed SAI Model Spec metadata
 */
export interface ModelSpecMetadata {
  /** Version of the SAI Model Spec */
  sai_model_spec?: string;
  /** Model architecture identifier */
  architecture?: string;
  /** Implementation framework/library */
  implementation?: string;
  /** Human-readable model name */
  title?: string;
  /** Model description */
  description?: string;
  /** Model creator */
  author?: string;
  /** Creation/modification date */
  date?: string;
  /** Training resolution */
  resolution?: string;
  /** Prediction type (epsilon, v_prediction, etc.) */
  prediction_type?: string;
  /** Encoder layer information */
  encoder_layer?: string;
}

/**
 * Training metadata (parsed from ss_* fields)
 */
export interface TrainingMetadata {
  /** Base model used for training */
  base_model_version?: BaseModelVersion;
  /** Number of training images */
  num_train_images?: number;
  /** Number of training epochs */
  num_epochs?: number;
  /** Learning rate */
  learning_rate?: number;
  /** Batch size */
  batch_size?: number;
  /** Network dimension/rank (LoRA) */
  network_dim?: number;
  /** Network alpha (LoRA) */
  network_alpha?: number;
  /** Optimizer used */
  optimizer?: string;
  /** LR scheduler */
  lr_scheduler?: string;
  /** Training start timestamp */
  training_started_at?: string;
  /** Training end timestamp */
  training_finished_at?: string;
  /** Dataset directories */
  dataset_dirs?: Record<string, { n_repeats: number; img_count: number }>;
  /** Tag frequency data */
  tag_frequency?: Record<string, Record<string, number>>;
  /** CLIP skip value */
  clip_skip?: number;
  /** Mixed precision setting */
  mixed_precision?: string;
  /** Gradient checkpointing */
  gradient_checkpointing?: boolean;
  /** Noise offset */
  noise_offset?: number;
  /** Caption dropout rate */
  caption_dropout_rate?: number;
}

/**
 * Model hash information
 */
export interface ModelHashes {
  /** Primary model hash */
  model_hash?: string;
  /** Legacy hash format */
  legacy_hash?: string;
  /** SD model hash */
  sd_model_hash?: string;
  /** New SD model hash format */
  new_sd_model_hash?: string;
}

/**
 * LoRA-specific information
 */
export interface LoRAInfo {
  /** Base model the LoRA is designed for */
  base_model: BaseModelVersion | null;
  /** Which components the LoRA modifies */
  target_components: LoRATarget[];
  /** Network rank/dimension */
  rank: number | null;
  /** Network alpha value */
  alpha: number | null;
  /** Extracted trigger words/keywords */
  trigger_words: string[];
  /** Module type (e.g., 'networks.lora') */
  module?: string;
}

/**
 * File statistics
 */
export interface FileStats {
  /** Total file size in bytes */
  file_size: number;
  /** Header size in bytes */
  header_size: number;
  /** Number of tensors */
  tensor_count: number;
  /** Total number of parameters */
  total_parameters: number;
  /** Unique data types used */
  data_types: TensorDataType[];
  /** Data type distribution */
  dtype_distribution: Record<TensorDataType, number>;
}

/**
 * Complete safetensors analysis result
 */
export interface SafetensorsAnalysis {
  /** Detected model type */
  model_type: ModelType;

  /** File statistics */
  file_stats: FileStats;

  /** Raw metadata from __metadata__ field */
  raw_metadata: RawMetadata;

  /** Parsed model spec metadata */
  model_spec: ModelSpecMetadata;

  /** Training metadata */
  training: TrainingMetadata;

  /** Model hashes */
  hashes: ModelHashes;

  /** LoRA-specific information (if applicable) */
  lora_info?: LoRAInfo;

  /** List of all tensors */
  tensors: TensorInfo[];

  /** Detected framework compatibility */
  compatibility: {
    pytorch: boolean;
    tensorflow: boolean;
    jax: boolean;
    numpy: boolean;
  };

  /** Any parsing warnings or errors */
  warnings: string[];
}

/**
 * Error types that can occur during analysis
 */
export type AnalysisError =
  | "INVALID_FORMAT"
  | "HEADER_TOO_LARGE"
  | "INVALID_JSON"
  | "FILE_NOT_FOUND"
  | "NETWORK_ERROR"
  | "PARSE_ERROR";

/**
 * Analysis error result
 */
export interface AnalysisErrorResult {
  error: AnalysisError;
  message: string;
  details?: any;
}

/**
 * Utility type for partial analysis results during streaming
 */
export type PartialAnalysis = Partial<SafetensorsAnalysis> & {
  model_type: ModelType;
  file_stats: Partial<FileStats>;
};
