# Safetensors Metadata Specification and Display Guide

## Overview

This document outlines the metadata that should be displayed in the safetensors inspector web application, based on the official safetensors format specification and analysis of example models.

## Safetensors Format Structure

The safetensors format consists of:

- **8 bytes**: An unsigned little-endian 64-bit integer describing the header size
- **N bytes**: A JSON UTF-8 string representing the header containing tensor definitions and metadata
- **Remaining bytes**: The actual tensor data

## Metadata Categories

### 1. File Information

- **File size**: Total size of the safetensors file
- **Header size**: Size of the JSON metadata header
- **Number of tensors**: Total count of tensors in the file
- **Total parameters**: Sum of all tensor parameters

### 2. Model Classification

The model type can be determined by analyzing:

#### a. Metadata Fields

- **`__metadata__`**: Special key containing string-to-string metadata
  - `modelspec.architecture`: e.g., "stable-diffusion-xl-v1-base/lora"
  - `modelspec.sai_model_spec`: Version of the SAI Model Spec
  - `format`: e.g., "pt" for PyTorch format

#### b. Tensor Name Patterns

| Model Type       | Identifying Patterns                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Checkpoint**   | Contains full model weights with patterns like `model.diffusion_model.*`, `cond_stage_model.*`, `first_stage_model.*` |
| **LoRA**         | Contains `lora_*.alpha`, `lora_*.lora_down.weight`, `lora_*.lora_up.weight`                                           |
| **VAE**          | Primarily contains `encoder.*` and `decoder.*` tensors                                                                |
| **ControlNet**   | Contains `input_blocks.*`, `middle_block.*`, `output_blocks.*` with ControlNet-specific layers                        |
| **Text Encoder** | Contains `text_model.*` or `transformer.*` tensors                                                                    |
| **Embedding**    | Single or few tensors, often with `emb_params` or similar                                                             |

### 3. Core Metadata Fields (SAI Model Spec)

According to the Stability AI Model Metadata Standard:

#### Required Fields (MUST have)

- `modelspec.sai_model_spec`: Version of the specification (e.g., "1.0.0")
- `modelspec.architecture`: Model architecture identifier
- `modelspec.implementation`: Implementation framework/library

#### Recommended Fields (SHOULD have)

- `modelspec.title`: Human-readable model name
- `modelspec.description`: Model description
- `modelspec.author`: Model creator
- `modelspec.date`: Creation/modification date
- `modelspec.resolution`: Training resolution (e.g., "1024x1024")
- `modelspec.prediction_type`: e.g., "epsilon", "v_prediction"

### 4. Training Metadata (Common in LoRA/Fine-tuned Models)

Many models include training information with `ss_` prefix:

- `ss_base_model_version`: Base model used for training
- `ss_num_train_images`: Number of training images
- `ss_num_epochs`: Training epochs
- `ss_learning_rate`: Learning rate used
- `ss_batch_size`: Batch size
- `ss_network_dim`: Network rank (for LoRA)
- `ss_network_alpha`: Network alpha (for LoRA)
- `ss_optimizer`: Optimizer used
- `ss_lr_scheduler`: Learning rate scheduler
- `ss_training_started_at`: Training start timestamp
- `ss_training_finished_at`: Training end timestamp
- `ss_dataset_dirs`: Dataset directories used
- `ss_tag_frequency`: Tag frequency information

### 4a. LoRA-Specific Information

For LoRA models, additional information can be extracted:

#### Base Model Detection

- **Primary source**: `ss_base_model_version` metadata field
- **Fallback**: Parse from `modelspec.architecture` (e.g., "stable-diffusion-xl-v1-base/lora")
- **Common values**: `sdxl_base_v1-0`, `sd_v1-5`, `sdxl_base_v0-9`

#### Target Components

LoRA models can target different parts of the model, identifiable by tensor name prefixes:

- **`lora_te1_*`**: Text Encoder 1 (CLIP-L for SDXL)
- **`lora_te2_*`**: Text Encoder 2 (CLIP-G for SDXL, not present in SD 1.5)
- **`lora_unet_*`**: UNet/Diffusion model

Example detection:

```javascript
function getLoRATargets(tensors) {
  const targets = new Set();
  for (const name of Object.keys(tensors)) {
    if (name.startsWith("lora_te1_")) targets.add("CLIP-L");
    else if (name.startsWith("lora_te2_")) targets.add("CLIP-G");
    else if (name.startsWith("lora_unet_")) targets.add("UNet");
  }
  return Array.from(targets);
}
```

#### Trigger Words/Keywords

Trigger words can be extracted from:

1. **`ss_tag_frequency`**: JSON-encoded string containing tag frequencies from training
   - Parse and sort by frequency to identify primary trigger words
   - The highest frequency tags often indicate trigger words
2. **Dataset directories**: Check `ss_dataset_dirs` for folder names that might indicate concepts
3. **Model title/filename**: Often contains the trigger word

Example parsing:

```javascript
function extractTriggerWords(metadata) {
  const triggers = [];

  // Parse tag frequency
  if (metadata.ss_tag_frequency) {
    const tagFreq = JSON.parse(metadata.ss_tag_frequency);
    const allTags = Object.values(tagFreq).reduce((acc, tags) => {
      return { ...acc, ...tags };
    }, {});

    // Get top tags by frequency
    const sortedTags = Object.entries(allTags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    triggers.push(...sortedTags);
  }

  return triggers;
}
```

### 5. Tensor Information

For each tensor, display:

- **Name**: Full tensor path
- **Shape**: Tensor dimensions  
- **dtype**: Data type (e.g., BOOL, F32, F16, BF16, F64, F8_E5M2, F8_E4M3, I8, I16, I32, I64, U8, U16, U32, U64)
- **Size**: Memory size in bytes
- **Parameters**: Number of parameters (product of shape dimensions)

### 6. Model Hash Information

- `sshs_model_hash`: Model hash
- `sshs_legacy_hash`: Legacy hash format
- `ss_sd_model_hash`: Stable Diffusion model hash
- `ss_new_sd_model_hash`: New format SD model hash

## Display Recommendations

### Summary View

1. **Model Type**: Auto-detected from tensor patterns and metadata
2. **Architecture**: From `modelspec.architecture` or auto-detected
3. **Title**: From `modelspec.title` or filename
4. **Size**: File size and parameter count
5. **Data Types**: List of unique dtypes used
6. **Compatibility**: Detected framework compatibility

#### LoRA-Specific Summary

For LoRA models, additionally display:

- **Base Model**: From `ss_base_model_version` or architecture
- **Target Components**: Which parts are modified (UNet, CLIP-L, CLIP-G)
- **Network Rank**: From `ss_network_dim`
- **Alpha**: From `ss_network_alpha`
- **Trigger Words**: Top keywords from training data

### Detailed View Tabs

#### 1. Overview Tab

- Model classification and basic info
- Key metadata fields
- Tensor statistics (count, total size, dtypes distribution)

#### 2. Metadata Tab

- Full `__metadata__` contents in a structured view
- Search/filter functionality
- JSON export option

#### 3. Tensors Tab

- Sortable table with tensor information
- Filter by name pattern, dtype, or size
- Tensor shape visualization
- Export tensor list

#### 4. Training Info Tab (if applicable)

- Training configuration
- Dataset information
- Hyperparameters
- Training timeline

#### 5. Compatibility Tab

- Detected base model
- Framework compatibility
- Required dependencies
- Usage examples

## Implementation Notes

1. **Model Type Detection Algorithm**:

   ```javascript
   function detectModelType(tensors, metadata) {
     // Check metadata first
     if (metadata?.["modelspec.architecture"]) {
       if (metadata["modelspec.architecture"].includes("/lora")) return "LoRA";
       // Add other metadata-based detection
     }

     // Fall back to tensor pattern matching
     const tensorNames = Object.keys(tensors);
     if (
       tensorNames.some(
         (name) => name.includes("lora_") && name.includes(".alpha"),
       )
     ) {
       return "LoRA";
     }
     if (
       tensorNames.some(
         (name) => name.startsWith("decoder.") || name.startsWith("encoder."),
       )
     ) {
       return "VAE";
     }
     // ... additional pattern matching
   }
   ```

2. **Metadata Parsing**:
   - All metadata values in safetensors are strings
   - Complex values (objects/arrays) are JSON-encoded strings that need parsing
   - Handle missing metadata gracefully

3. **Performance Considerations**:
   - Use HTTP range requests to read only the header for web URLs
   - Implement lazy loading for large tensor lists
   - Cache parsed metadata

4. **Security**:
   - Validate all metadata before display
   - Sanitize HTML contentf
   - Limit header size parsing (safetensors limit: 100MB)
