/**
 * Tests for safetensors parsing functions
 */

import { describe, expect, it } from "vitest";
import {
  analyzeSafetensors,
  calculateTensorStats,
  detectModelType,
  extractLoRATargets,
  extractTriggerWords,
  parseHeader,
  parseMetadata,
  readHeaderSize,
} from "./parse";
import type { RawMetadata, SafetensorsHeader } from "./schema";

describe("readHeaderSize", () => {
  it("should read header size from valid buffer", () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    // Write 1024 as little-endian 64-bit
    view.setUint32(0, 1024, true);
    view.setUint32(4, 0, true);

    expect(readHeaderSize(buffer)).toBe(1024);
  });

  it("should throw on buffer too small", () => {
    const buffer = new ArrayBuffer(7);
    expect(() => readHeaderSize(buffer)).toThrow("too small");
  });

  it("should throw on header too large", () => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    // Write a very large number
    view.setUint32(0, 0xffffffff, true);
    view.setUint32(4, 0xff, true);

    expect(() => readHeaderSize(buffer)).toThrow("exceeds maximum");
  });
});

describe("parseHeader", () => {
  it("should parse valid header", () => {
    const headerData = {
      __metadata__: { format: "pt" },
      weight: {
        dtype: "F32",
        shape: [10, 20],
        data_offsets: [0, 800],
      },
    };
    const headerJson = JSON.stringify(headerData);
    const headerSize = headerJson.length;

    // Create buffer with header
    const buffer = new ArrayBuffer(8 + headerSize);
    const view = new DataView(buffer);
    view.setUint32(0, headerSize, true);
    view.setUint32(4, 0, true);

    // Write header JSON
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(headerJson);
    new Uint8Array(buffer, 8).set(headerBytes);

    const result = parseHeader(buffer);
    expect(result.size).toBe(headerSize);
    expect(result.data.__metadata__).toEqual({ format: "pt" });
    expect(result.data.weight).toEqual({
      dtype: "F32",
      shape: [10, 20],
      data_offsets: [0, 800],
    });
  });

  it("should throw on invalid JSON", () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setUint32(0, 8, true);
    view.setUint32(4, 0, true);
    // Invalid JSON
    new Uint8Array(buffer, 8).set([123, 34, 98, 97, 100, 34, 58]); // '{"bad":'

    expect(() => parseHeader(buffer)).toThrow("Invalid header JSON");
  });
});

describe("detectModelType", () => {
  it("should detect LoRA from metadata", () => {
    const metadata: RawMetadata = {
      "modelspec.architecture": "stable-diffusion-xl-v1-base/lora",
    };
    expect(detectModelType([], metadata)).toBe("lora");
  });

  it("should detect LoRA from tensor names", () => {
    const tensorNames = [
      "lora_te1_text_model.encoder.layers.0.mlp.fc1.alpha",
      "lora_te1_text_model.encoder.layers.0.mlp.fc1.lora_down.weight",
      "lora_unet_input_blocks.0.0.weight",
    ];
    expect(detectModelType(tensorNames)).toBe("lora");
  });

  it("should detect VAE", () => {
    const tensorNames = [
      "decoder.conv_in.weight",
      "encoder.conv_out.weight",
      "decoder.mid_block.resnets.0.conv1.weight",
    ];
    expect(detectModelType(tensorNames)).toBe("vae");
  });

  it("should detect checkpoint", () => {
    const tensorNames = [
      "model.diffusion_model.input_blocks.0.0.weight",
      "cond_stage_model.transformer.text_model.embeddings.token_embedding.weight",
      "first_stage_model.encoder.conv_in.weight",
    ];
    expect(detectModelType(tensorNames)).toBe("checkpoint");
  });

  it("should detect text encoder", () => {
    const tensorNames = [
      "text_model.embeddings.token_embedding.weight",
      "text_model.encoder.layers.0.self_attn.k_proj.weight",
    ];
    expect(detectModelType(tensorNames)).toBe("text_encoder");
  });

  it("should return unknown for unrecognized patterns", () => {
    const tensorNames = ["some_random_tensor", "another_tensor"];
    expect(detectModelType(tensorNames)).toBe("unknown");
  });
});

describe("extractLoRATargets", () => {
  it("should extract all LoRA targets", () => {
    const tensorNames = [
      "lora_te1_text_model.encoder.layers.0.mlp.fc1.alpha",
      "lora_te2_text_model.encoder.layers.0.mlp.fc1.alpha",
      "lora_unet_input_blocks.0.0.weight",
    ];
    const targets = extractLoRATargets(tensorNames);
    expect(targets).toHaveLength(3);
    expect(targets).toContain("CLIP-L");
    expect(targets).toContain("CLIP-G");
    expect(targets).toContain("UNet");
  });

  it("should return empty array for non-LoRA tensors", () => {
    const tensorNames = ["model.weight", "decoder.conv_in.weight"];
    expect(extractLoRATargets(tensorNames)).toEqual([]);
  });

  it("should deduplicate targets", () => {
    const tensorNames = [
      "lora_te1_layer1.weight",
      "lora_te1_layer2.weight",
      "lora_te1_layer3.weight",
    ];
    const targets = extractLoRATargets(tensorNames);
    expect(targets).toEqual(["CLIP-L"]);
  });
});

describe("extractTriggerWords", () => {
  it("should extract top trigger words", () => {
    const tagFrequency = JSON.stringify({
      img: {
        "1girl": 100,
        solo: 95,
        blue_archive: 120,
        halo: 80,
        school_uniform: 60,
      },
    });
    const words = extractTriggerWords(tagFrequency, 3);
    expect(words).toEqual(["blue_archive", "1girl", "solo"]);
  });

  it("should handle empty tag frequency", () => {
    expect(extractTriggerWords(undefined)).toEqual([]);
    expect(extractTriggerWords("")).toEqual([]);
  });

  it("should handle invalid JSON", () => {
    expect(extractTriggerWords("invalid json")).toEqual([]);
  });

  it("should merge multiple categories", () => {
    const tagFrequency = JSON.stringify({
      cat1: { tag1: 50, tag2: 100 },
      cat2: { tag3: 150, tag4: 25 },
    });
    const words = extractTriggerWords(tagFrequency, 2);
    expect(words).toEqual(["tag3", "tag2"]);
  });
});

describe("parseMetadata", () => {
  it("should parse model spec fields", () => {
    const raw: RawMetadata = {
      "modelspec.sai_model_spec": "1.0.0",
      "modelspec.architecture": "stable-diffusion-xl-v1-base/lora",
      "modelspec.title": "Test Model",
      "modelspec.resolution": "1024x1024",
    };
    const { modelSpec } = parseMetadata(raw);

    expect(modelSpec.sai_model_spec).toBe("1.0.0");
    expect(modelSpec.architecture).toBe("stable-diffusion-xl-v1-base/lora");
    expect(modelSpec.title).toBe("Test Model");
    expect(modelSpec.resolution).toBe("1024x1024");
  });

  it("should parse training fields", () => {
    const raw: RawMetadata = {
      ss_base_model_version: "sdxl_base_v1-0",
      ss_num_train_images: "100",
      ss_learning_rate: "0.0001",
      ss_network_dim: "32",
      ss_gradient_checkpointing: "True",
      ss_optimizer: "AdamW",
    };
    const { training } = parseMetadata(raw);

    expect(training.base_model_version).toBe("sdxl_base_v1-0");
    expect(training.num_train_images).toBe(100);
    expect(training.learning_rate).toBe(0.0001);
    expect(training.network_dim).toBe(32);
    expect(training.gradient_checkpointing).toBe(true);
    expect(training.optimizer).toBe("AdamW");
  });

  it("should parse hash fields", () => {
    const raw: RawMetadata = {
      sshs_model_hash: "abc123",
      sshs_legacy_hash: "def456",
      ss_sd_model_hash: "ghi789",
      ss_new_sd_model_hash: "jkl012",
    };
    const { hashes } = parseMetadata(raw);

    expect(hashes.model_hash).toBe("abc123");
    expect(hashes.legacy_hash).toBe("def456");
    expect(hashes.sd_model_hash).toBe("ghi789");
    expect(hashes.new_sd_model_hash).toBe("jkl012");
  });

  it("should handle JSON fields", () => {
    const raw: RawMetadata = {
      ss_dataset_dirs: '{"train": {"n_repeats": 5, "img_count": 100}}',
      ss_tag_frequency: '{"img": {"tag1": 10, "tag2": 20}}',
    };
    const { training } = parseMetadata(raw);

    expect(training.dataset_dirs).toEqual({
      train: { n_repeats: 5, img_count: 100 },
    });
    expect(training.tag_frequency).toEqual({
      img: { tag1: 10, tag2: 20 },
    });
  });
});

describe("calculateTensorStats", () => {
  it("should calculate tensor statistics", () => {
    const tensors = [
      {
        name: "tensor1",
        dtype: "F32" as const,
        shape: [10, 20],
        data_offsets: [0, 800] as [number, number],
      },
      {
        name: "tensor2",
        dtype: "F16" as const,
        shape: [5, 5, 4],
        data_offsets: [800, 1000] as [number, number],
      },
      {
        name: "tensor3",
        dtype: "F32" as const,
        shape: [100],
        data_offsets: [1000, 1400] as [number, number],
      },
    ];

    const stats = calculateTensorStats(tensors);

    expect(stats.tensor_count).toBe(3);
    expect(stats.total_parameters).toBe(10 * 20 + 5 * 5 * 4 + 100); // 400
    expect(stats.data_types).toContain("F32");
    expect(stats.data_types).toContain("F16");
    expect(stats.dtype_distribution).toEqual({
      F32: 2,
      F16: 1,
    });
  });

  it("should sort data_types by usage count in descending order", () => {
    const tensors = [
      {
        name: "tensor1",
        dtype: "F32" as const,
        shape: [10],
        data_offsets: [0, 40] as [number, number],
      },
      {
        name: "tensor2",
        dtype: "F16" as const,
        shape: [10],
        data_offsets: [40, 60] as [number, number],
      },
      {
        name: "tensor3",
        dtype: "F16" as const,
        shape: [10],
        data_offsets: [60, 80] as [number, number],
      },
      {
        name: "tensor4",
        dtype: "F16" as const,
        shape: [10],
        data_offsets: [80, 100] as [number, number],
      },
      {
        name: "tensor5",
        dtype: "BF16" as const,
        shape: [10],
        data_offsets: [100, 120] as [number, number],
      },
      {
        name: "tensor6",
        dtype: "BF16" as const,
        shape: [10],
        data_offsets: [120, 140] as [number, number],
      },
    ];

    const stats = calculateTensorStats(tensors);

    // F16 appears 3 times, BF16 appears 2 times, F32 appears 1 time
    expect(stats.data_types).toEqual(["F16", "BF16", "F32"]);
    expect(stats.dtype_distribution).toEqual({
      F16: 3,
      BF16: 2,
      F32: 1,
    });
  });

  it("should handle empty tensor list", () => {
    const stats = calculateTensorStats([]);

    expect(stats.tensor_count).toBe(0);
    expect(stats.total_parameters).toBe(0);
    expect(stats.data_types).toEqual([]);
    expect(stats.dtype_distribution).toEqual({});
  });

  it("should handle scalar tensors (empty shape)", () => {
    const tensors = [
      {
        name: "scalar",
        dtype: "F32" as const,
        shape: [],
        data_offsets: [0, 4] as [number, number],
      },
    ];

    const stats = calculateTensorStats(tensors);
    expect(stats.total_parameters).toBe(1);
  });
});

describe("analyzeSafetensors", () => {
  const createTestHeader = (
    overrides?: Partial<SafetensorsHeader>,
  ): SafetensorsHeader => ({
    size: 1000,
    data: {
      __metadata__: {
        format: "pt",
        "modelspec.architecture": "stable-diffusion-xl-v1-base/lora",
        ss_base_model_version: "sdxl_base_v1-0",
        ss_network_dim: "32",
        ss_tag_frequency: '{"img": {"trigger_word": 100, "1girl": 80}}',
      },
      "lora_te1_text_model.layer.weight": {
        dtype: "F16",
        shape: [768, 32],
        data_offsets: [0, 49152],
      },
      "lora_unet_input_blocks.weight": {
        dtype: "F16",
        shape: [320, 32],
        data_offsets: [49152, 69632],
      },
    },
    ...overrides,
  });

  it("should analyze LoRA model", () => {
    const header = createTestHeader();
    const result = analyzeSafetensors(header, 100000);

    expect(result.model_type).toBe("lora");
    expect(result.file_stats.file_size).toBe(100000);
    expect(result.file_stats.header_size).toBe(1000);
    expect(result.file_stats.tensor_count).toBe(2);

    expect(result.model_spec.architecture).toBe(
      "stable-diffusion-xl-v1-base/lora",
    );
    expect(result.training.base_model_version).toBe("sdxl_base_v1-0");
    expect(result.training.network_dim).toBe(32);

    expect(result.lora_info).toBeDefined();
    expect(result.lora_info?.base_model).toBe("sdxl_base_v1-0");
    expect(result.lora_info?.target_components).toContain("CLIP-L");
    expect(result.lora_info?.target_components).toContain("UNet");
    expect(result.lora_info?.rank).toBe(32);
    expect(result.lora_info?.trigger_words).toContain("trigger_word");
  });

  it("should respect max_tensors option", () => {
    const header = createTestHeader();
    const result = analyzeSafetensors(header, 100000, { max_tensors: 1 });

    expect(result.tensors).toHaveLength(1);
    expect(result.warnings).toContain("Tensor list truncated to 1 items");
  });

  it("should skip tensors when include_tensors is false", () => {
    const header = createTestHeader();
    const result = analyzeSafetensors(header, 100000, {
      include_tensors: false,
    });

    expect(result.tensors).toHaveLength(0);
  });

  it("should not extract trigger words when disabled", () => {
    const header = createTestHeader();
    const result = analyzeSafetensors(header, 100000, {
      extract_trigger_words: false,
    });

    expect(result.lora_info?.trigger_words).toHaveLength(0);
  });
});
