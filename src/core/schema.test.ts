/**
 * Tests for Zod schemas
 */

import { describe, expect, it } from "vitest";
import {
  zAnalysisInput,
  zAnalysisOptions,
  zBufferInput,
  zFileInput,
  zRawMetadata,
  zRawTensorInfo,
  zSafetensorsHeader,
  zSafetensorsHeaderData,
  zTensorDataType,
  zURLInput,
} from "./schema";

describe("zTensorDataType", () => {
  it("should accept valid tensor data types", () => {
    const validTypes = [
      "BOOL",
      "U8",
      "I8",
      "F8_E5M2",
      "F8_E4M3",
      "I16",
      "U16",
      "F16",
      "BF16",
      "I32",
      "U32",
      "F32",
      "F64",
      "I64",
      "U64",
    ];

    for (const type of validTypes) {
      expect(zTensorDataType.parse(type)).toBe(type);
    }
  });

  it("should reject invalid tensor data types", () => {
    const invalidTypes = [
      "INT8",
      "FLOAT32",
      "unknown",
      "",
      null,
      undefined,
    ];

    for (const type of invalidTypes) {
      expect(() => zTensorDataType.parse(type)).toThrow();
    }
  });
});

describe("zRawTensorInfo", () => {
  it("should accept valid tensor info", () => {
    const validTensorInfo = {
      dtype: "F32",
      shape: [10, 20, 30],
      data_offsets: [0, 24000],
    };

    const result = zRawTensorInfo.parse(validTensorInfo);
    expect(result).toEqual(validTensorInfo);
  });

  it("should reject invalid tensor info", () => {
    const invalidCases = [
      // Missing fields
      { dtype: "F32", shape: [10] },
      { dtype: "F32", data_offsets: [0, 100] },
      { shape: [10], data_offsets: [0, 100] },

      // Wrong types
      { dtype: "INVALID", shape: [10], data_offsets: [0, 100] },
      { dtype: "F32", shape: "invalid", data_offsets: [0, 100] },
      { dtype: "F32", shape: [10], data_offsets: [0] }, // Wrong tuple length
      { dtype: "F32", shape: [10], data_offsets: [0, 100, 200] }, // Wrong tuple length

      // Wrong shape types
      { dtype: "F32", shape: ["10", "20"], data_offsets: [0, 100] },
    ];

    for (const invalid of invalidCases) {
      expect(() => zRawTensorInfo.parse(invalid)).toThrow();
    }
  });
});

describe("zRawMetadata", () => {
  it("should accept valid metadata", () => {
    const validMetadata = {
      format: "pt",
      "modelspec.architecture": "stable-diffusion-xl-v1-base/lora",
      ss_base_model_version: "sdxl_base_v1-0",
      ss_learning_rate: "0.0001",
    };

    const result = zRawMetadata.parse(validMetadata);
    expect(result).toEqual(validMetadata);
  });

  it("should accept empty metadata", () => {
    const result = zRawMetadata.parse({});
    expect(result).toEqual({});
  });

  it("should reject non-string values", () => {
    const invalidCases = [
      { format: 123 },
      { format: true },
      { format: null },
      { format: undefined },
      { format: [] },
      { format: {} },
    ];

    for (const invalid of invalidCases) {
      expect(() => zRawMetadata.parse(invalid)).toThrow();
    }
  });
});

describe("zSafetensorsHeaderData", () => {
  it("should accept valid header data", () => {
    const validHeader = {
      __metadata__: {
        format: "pt",
        title: "Test Model",
      },
      weight1: {
        dtype: "F32",
        shape: [10, 20],
        data_offsets: [0, 800],
      },
      weight2: {
        dtype: "F16",
        shape: [5, 5],
        data_offsets: [800, 850],
      },
    };

    const result = zSafetensorsHeaderData.parse(validHeader);
    expect(result).toEqual(validHeader);
  });

  it("should accept header without metadata", () => {
    const validHeader = {
      weight1: {
        dtype: "F32",
        shape: [10, 20],
        data_offsets: [0, 800],
      },
    };

    const result = zSafetensorsHeaderData.parse(validHeader);
    expect(result).toEqual(validHeader);
  });

  it("should reject invalid metadata structure", () => {
    const invalidCases = [
      // Array metadata
      {
        __metadata__: ["not", "an", "object"],
        weight1: { dtype: "F32", shape: [10], data_offsets: [0, 40] },
      },
      // Null metadata
      {
        __metadata__: null,
        weight1: { dtype: "F32", shape: [10], data_offsets: [0, 40] },
      },
    ];

    for (const invalid of invalidCases) {
      expect(() => zSafetensorsHeaderData.parse(invalid)).toThrow();
    }
  });
});

describe("zSafetensorsHeader", () => {
  it("should accept valid header", () => {
    const validHeader = {
      size: 1024,
      data: {
        __metadata__: { format: "pt" },
        weight: {
          dtype: "F32",
          shape: [10, 20],
          data_offsets: [0, 800],
        },
      },
    };

    const result = zSafetensorsHeader.parse(validHeader);
    expect(result).toEqual(validHeader);
  });

  it("should reject invalid header", () => {
    const invalidCases = [
      // Missing size
      {
        data: {
          weight: { dtype: "F32", shape: [10], data_offsets: [0, 40] },
        },
      },
      // Missing data
      { size: 1024 },
      // Invalid size type
      {
        size: "1024",
        data: {
          weight: { dtype: "F32", shape: [10], data_offsets: [0, 40] },
        },
      },
    ];

    for (const invalid of invalidCases) {
      expect(() => zSafetensorsHeader.parse(invalid)).toThrow();
    }
  });
});

describe("zFileInput", () => {
  it("should accept valid file input", () => {
    const validInput = {
      type: "file",
      path: "/path/to/model.safetensors",
    };

    const result = zFileInput.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it("should reject invalid file input", () => {
    const invalidCases = [
      // Wrong type
      { type: "url", path: "/path/to/file" },
      // Missing path
      { type: "file" },
      // Empty path
      { type: "file", path: "" },
      // Wrong path type
      { type: "file", path: 123 },
    ];

    for (const invalid of invalidCases) {
      expect(() => zFileInput.parse(invalid)).toThrow();
    }
  });
});

describe("zURLInput", () => {
  it("should accept valid URL input", () => {
    const validInput = {
      type: "url",
      url: "https://example.com/model.safetensors",
    };

    const result = zURLInput.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it("should reject invalid URL input", () => {
    const invalidCases = [
      // Wrong type
      { type: "file", url: "https://example.com" },
      // Missing URL
      { type: "url" },
      // Invalid URL format
      { type: "url", url: "not-a-url" },
      // Remove this case since ftp:// is technically a valid URL format
      // Wrong URL type
      { type: "url", url: 123 },
    ];

    for (const invalid of invalidCases) {
      expect(() => zURLInput.parse(invalid)).toThrow();
    }
  });
});

describe("zBufferInput", () => {
  it("should accept valid buffer input", () => {
    const buffer = new ArrayBuffer(1024);
    const validInput = {
      type: "buffer",
      buffer,
      filename: "model.safetensors",
    };

    const result = zBufferInput.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it("should accept buffer input without filename", () => {
    const buffer = new ArrayBuffer(1024);
    const validInput = {
      type: "buffer",
      buffer,
    };

    const result = zBufferInput.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it("should reject invalid buffer input", () => {
    const buffer = new ArrayBuffer(1024);
    const invalidCases = [
      // Wrong type
      { type: "file", buffer },
      // Missing buffer
      { type: "buffer" },
      // Wrong buffer type
      { type: "buffer", buffer: "not-a-buffer" },
      { type: "buffer", buffer: new Uint8Array(10) }, // Not ArrayBuffer
      // Wrong filename type
      { type: "buffer", buffer, filename: 123 },
    ];

    for (const invalid of invalidCases) {
      expect(() => zBufferInput.parse(invalid)).toThrow();
    }
  });
});

describe("zAnalysisInput", () => {
  it("should accept all valid input types", () => {
    const fileInput = { type: "file", path: "/path/to/file" };
    const urlInput = {
      type: "url",
      url: "https://example.com/model.safetensors",
    };
    const bufferInput = { type: "buffer", buffer: new ArrayBuffer(1024) };

    expect(zAnalysisInput.parse(fileInput)).toEqual(fileInput);
    expect(zAnalysisInput.parse(urlInput)).toEqual(urlInput);
    expect(zAnalysisInput.parse(bufferInput)).toEqual(bufferInput);
  });

  it("should use discriminated union correctly", () => {
    // Test that it properly discriminates based on type field
    const mixedInvalid = {
      type: "file",
      url: "https://example.com", // URL field with file type
    };

    expect(() => zAnalysisInput.parse(mixedInvalid)).toThrow();
  });
});

describe("zAnalysisOptions", () => {
  it("should accept valid options", () => {
    const validOptions = {
      include_tensors: true,
      max_tensors: 100,
      extract_trigger_words: false,
      max_trigger_words: 10,
    };

    const result = zAnalysisOptions.parse(validOptions);
    expect(result).toEqual(validOptions);
  });

  it("should accept empty options", () => {
    const result = zAnalysisOptions.parse({});
    expect(result).toEqual({});
  });

  it("should accept partial options", () => {
    const partialOptions = {
      include_tensors: false,
      max_trigger_words: 5,
    };

    const result = zAnalysisOptions.parse(partialOptions);
    expect(result).toEqual(partialOptions);
  });

  it("should reject invalid option types", () => {
    const invalidCases = [
      { include_tensors: "true" }, // String instead of boolean
      { max_tensors: "100" }, // String instead of number
      { extract_trigger_words: 1 }, // Number instead of boolean
      { max_trigger_words: true }, // Boolean instead of number
    ];

    for (const invalid of invalidCases) {
      expect(() => zAnalysisOptions.parse(invalid)).toThrow();
    }
  });
});
