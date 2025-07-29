/**
 * Zod schemas for Safetensors input validation
 * This file contains schemas for validating input data from safetensors files
 */

import { z } from "zod";

/**
 * Supported data types in safetensors format
 */
export const zTensorDataType = z.enum([
  "F32",
  "F16",
  "BF16",
  "I8",
  "I16",
  "I32",
  "I64",
  "U8",
  "U16",
  "U32",
  "U64",
]);
export type TensorDataType = z.infer<typeof zTensorDataType>;

/**
 * Raw tensor info from safetensors header
 */
export const zRawTensorInfo = z.object({
  dtype: zTensorDataType,
  shape: z.array(z.number()),
  data_offsets: z.tuple([z.number(), z.number()]),
});
export type RawTensorInfo = z.infer<typeof zRawTensorInfo>;

/**
 * Raw metadata from __metadata__ field
 * All values are strings in safetensors format
 */
export const zRawMetadata = z.record(z.string(), z.string());
export type RawMetadata = z.infer<typeof zRawMetadata>;

/**
 * Safetensors header data structure
 * This represents the raw JSON header in a safetensors file
 */
export const zSafetensorsHeaderData = z
  .record(z.string(), z.union([zRawTensorInfo, zRawMetadata]))
  .refine(
    (data) => {
      // Ensure __metadata__ is a record if it exists
      if ("__metadata__" in data && data.__metadata__) {
        return (
          typeof data.__metadata__ === "object" &&
          !Array.isArray(data.__metadata__)
        );
      }
      return true;
    },
    { message: "__metadata__ must be an object" },
  );
export type SafetensorsHeaderData = z.infer<typeof zSafetensorsHeaderData>;

/**
 * Result of parsing the safetensors header
 */
export const zSafetensorsHeader = z.object({
  /** Size of the header in bytes */
  size: z.number(),
  /** Parsed JSON data */
  data: zSafetensorsHeaderData,
});
export type SafetensorsHeader = z.infer<typeof zSafetensorsHeader>;

/**
 * Input validation schemas for analysis
 */

/**
 * File input for local file analysis
 */
export const zFileInput = z.object({
  type: z.literal("file"),
  path: z.string().min(1, "File path is required"),
});

/**
 * URL input for remote file analysis
 */
export const zURLInput = z.object({
  type: z.literal("url"),
  url: z.string().url(),
});

/**
 * Buffer input for in-memory analysis
 */
export const zBufferInput = z.object({
  type: z.literal("buffer"),
  buffer: z.instanceof(ArrayBuffer),
  filename: z.string().optional(),
});

/**
 * Union of all input types
 */
export const zAnalysisInput = z.discriminatedUnion("type", [
  zFileInput,
  zURLInput,
  zBufferInput,
]);
export type AnalysisInput = z.infer<typeof zAnalysisInput>;

/**
 * Options for analyzing safetensors files
 */
export const zAnalysisOptions = z.object({
  /** Whether to parse all tensor information (can be memory intensive) */
  include_tensors: z.boolean().optional(),
  /** Maximum number of tensors to include in the result */
  max_tensors: z.number().optional(),
  /** Whether to extract trigger words from tag frequency */
  extract_trigger_words: z.boolean().optional(),
  /** Maximum number of trigger words to extract */
  max_trigger_words: z.number().optional(),
});
export type AnalysisOptions = z.infer<typeof zAnalysisOptions>;
