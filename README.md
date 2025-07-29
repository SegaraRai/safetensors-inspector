# Safetensors Inspector

A web-based tool for analyzing and inspecting `.safetensors` model files directly in your browser.

## Features

- **Browser-based**: No installation required, works entirely in your browser
- **Model Analysis**: View tensor shapes, data types, and metadata
- **Model Type Detection**: Automatically identifies model architecture (SD, SDXL, LoRA, etc.)
- **Metadata Viewer**: Inspect embedded metadata and training information
- **Performance**: Fast parsing with streaming support for large files

## Usage

1. Visit [safetensors-inspector.roundtrip.dev](https://safetensors-inspector.roundtrip.dev)
2. Drag and drop a `.safetensors` file or click to browse
3. View model details, tensors, and metadata instantly

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Tech Stack

- [Astro](https://astro.build/) - Web framework
- [Solid.js](https://www.solidjs.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- TypeScript - Type safety

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
