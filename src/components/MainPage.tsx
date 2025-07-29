import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type Component,
} from "solid-js";
import {
  analyzeSafetensors,
  parseHeader,
  readHeaderStreaming,
} from "../core/parse";
import type { SafetensorsAnalysis } from "../core/types";
import { SafetensorsAnalysisDisplay } from "./analysis";
import Badge from "./ui/Badge";
import Card from "./ui/Card";

const MainPage: Component = () => {
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [analysis, setAnalysis] = createSignal<SafetensorsAnalysis | null>(
    null,
  );
  const [error, setError] = createSignal<string | null>(null);
  const [fileName, setFileName] = createSignal<string>("");

  let fileInputRef: HTMLInputElement | undefined;

  // Update page title based on file name
  createEffect(() => {
    const name = fileName();
    if (name) {
      document.title = `${name} - Safetensors Inspector`;
    } else {
      document.title = "Safetensors Inspector";
    }
  });

  const handleFile = async (file: File) => {
    if (!file) return;

    const validExtensions = [".safetensors", ".json"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      setError(
        `Invalid file type. Please select a ${validExtensions.join(" or ")} file.`,
      );
      return;
    }

    setError(null);
    setIsProcessing(true);
    setFileName(file.name);

    try {
      if (fileExtension === ".json") {
        // Handle JSON file (pre-extracted metadata)
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // If it's a JSON dump of safetensors header, analyze it
        if (jsonData && typeof jsonData === "object") {
          const mockHeader = {
            size: JSON.stringify(jsonData).length,
            data: jsonData,
          };
          const analysisResult = analyzeSafetensors(mockHeader, file.size, {
            max_trigger_words: 20,
          });
          setAnalysis(analysisResult);
        } else {
          throw new Error("Invalid JSON structure");
        }
      } else {
        // Handle .safetensors file using blob slicing
        const readFile = async (
          offset: number,
          size: number,
        ): Promise<ArrayBuffer> => {
          const slice = file.slice(offset, offset + size);
          return await slice.arrayBuffer();
        };

        const headerBuffer = await readHeaderStreaming(readFile);
        const header = parseHeader(headerBuffer);
        const analysisResult = analyzeSafetensors(header, file.size, {
          max_trigger_words: 20,
        });
        setAnalysis(analysisResult);
      }
    } catch (err: any) {
      console.error("File processing error:", err);
      setError(`Failed to process file: ${err.message || "Unknown error"}`);
      setAnalysis(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef?.click();
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setFileName("");
    if (fileInputRef) {
      fileInputRef.value = "";
    }
  };

  onMount(() => {
    // Handle drag and drop on the entire document
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDocumentDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only hide drag overlay if leaving the document entirely
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragOver(false);
      }
    };

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };

    const handleDocumentDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    // Add event listeners to document
    document.addEventListener("dragenter", handleDocumentDragEnter);
    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("dragleave", handleDocumentDragLeave);
    document.addEventListener("drop", handleDocumentDrop);

    onCleanup(() => {
      document.removeEventListener("dragenter", handleDocumentDragEnter);
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("dragleave", handleDocumentDragLeave);
      document.removeEventListener("drop", handleDocumentDrop);
    });
  });

  return (
    <div class="min-h-screen bg-base-200 relative grid grid-rows-[auto_1fr_auto]">
      {/* Full-page drag overlay */}
      <Show when={isDragOver()}>
        <div class="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary flex items-center justify-center">
          <div class="bg-base-100 p-8 rounded-xl shadow-xl border border-primary/20">
            <div class="text-center">
              <div class="mb-4">
                <span class="size-24 icon-[fluent-emoji--file-folder]"></span>
              </div>
              <h3 class="text-2xl font-bold text-primary mb-2">
                {analysis()
                  ? "Drop to analyze new file"
                  : "Drop your file here"}
              </h3>
              <p class="text-base-content/60">
                Release to analyze your .safetensors or .json file
              </p>
            </div>
          </div>
        </div>
      </Show>

      {/* Header */}
      <div class="bg-base-100 shadow-sm border-b border-base-300">
        <div class="max-w-7xl w-full mx-auto px-4 py-6 overflow-hidden">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-base-content">
                <a href="/" class="link link-hover">
                  Safetensors Inspector
                </a>
              </h1>
              <p class="text-base-content/60 mt-1">
                Analyze and explore safetensors model files
              </p>
            </div>
            <Show when={analysis()}>
              <button class="btn btn-outline btn-sm" onClick={resetAnalysis}>
                Analyze New File
              </button>
            </Show>
          </div>
        </div>
      </div>

      <div class="max-w-7xl w-full mx-auto px-4 py-8 overflow-hidden">
        <Show
          when={!analysis()}
          fallback={
            <Show when={analysis()} keyed>
              {(analysisData) => (
                <SafetensorsAnalysisDisplay
                  analysis={analysisData}
                  fileName={fileName()}
                />
              )}
            </Show>
          }
        >
          {/* File Upload Section */}
          <div class="space-y-8">
            {/* App Description */}
            <Card title="About Safetensors Inspector" bordered shadow>
              <div class="prose max-w-none">
                <p class="text-base-content/80 mb-4">
                  Safetensors Inspector is a comprehensive tool for analyzing
                  safetensors model files. It extracts and displays detailed
                  metadata, tensor information, and model specifications in an
                  easy-to-understand format.
                </p>

                {/* Privacy Notice */}
                <div class="alert alert-success alert-soft mb-6">
                  <div>
                    <h4 class="font-semibold">
                      Complete Privacy &amp; Security
                    </h4>
                    <p class="text-sm mt-1">
                      All file analysis is performed entirely in your browser.
                      Your files never leave your device and are not uploaded to
                      any server. Your data remains completely private and
                      secure.
                    </p>
                  </div>
                </div>

                <div class="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 class="text-lg font-semibold mb-3">
                      Supported Features
                    </h3>
                    <ul class="space-y-2 text-sm">
                      <li class="flex items-center gap-2">
                        <Badge variant="success" size="xs">
                          <span
                            role="none"
                            class="icon-[famicons--checkmark]"
                          ></span>
                        </Badge>
                        Model type detection (Checkpoint, VAE, LoRA, etc.)
                      </li>
                      <li class="flex items-center gap-2">
                        <Badge variant="success" size="xs">
                          <span
                            role="none"
                            class="icon-[famicons--checkmark]"
                          ></span>
                        </Badge>
                        LoRA-specific information extraction
                      </li>
                      <li class="flex items-center gap-2">
                        <Badge variant="success" size="xs">
                          <span
                            role="none"
                            class="icon-[famicons--checkmark]"
                          ></span>
                        </Badge>
                        Training metadata and parameters
                      </li>
                      <li class="flex items-center gap-2">
                        <Badge variant="success" size="xs">
                          <span
                            role="none"
                            class="icon-[famicons--checkmark]"
                          ></span>
                        </Badge>
                        Tensor analysis and statistics
                      </li>
                      <li class="flex items-center gap-2">
                        <Badge variant="success" size="xs">
                          <span
                            role="none"
                            class="icon-[famicons--checkmark]"
                          ></span>
                        </Badge>
                        Model hashes and compatibility info
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 class="text-lg font-semibold mb-3">Supported Files</h3>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <Badge variant="primary" size="sm">
                          .safetensors
                        </Badge>
                        <span class="text-sm text-base-content/70">
                          Direct model files
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          .json
                        </Badge>
                        <span class="text-sm text-base-content/70">
                          Extracted metadata
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* File Drop Zone */}
            <div
              class={`
                relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
                ${
                  isDragOver()
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-base-300 hover:border-base-400 hover:bg-base-100"
                }
                ${isProcessing() ? "pointer-events-none opacity-50" : ""}
              `}
              onClick={handleClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".safetensors,.json"
                class="hidden"
                onChange={handleFileSelect}
                disabled={isProcessing()}
              />

              <Show
                when={!isProcessing()}
                fallback={
                  <div class="space-y-4">
                    <div class="flex justify-center">
                      <span class="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                    <div>
                      <h3 class="text-xl font-semibold mb-2">Processing...</h3>
                      <p class="text-base-content/60">Analyzing {fileName()}</p>
                    </div>
                  </div>
                }
              >
                <div class="space-y-4">
                  <div class="flex justify-center">
                    <div
                      class={`
                      size-36 rounded-full flex items-center justify-center text-2xl transition-colors
                      ${isDragOver() ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/60"}
                    `}
                    >
                      <span class="size-22 icon-[fluent-emoji--file-folder]"></span>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold mb-2">
                      {isDragOver()
                        ? "Drop your file here"
                        : "Select or drop a file"}
                    </h3>
                    <p class="text-base-content/60 mb-4">
                      Choose a .safetensors or .json file to analyze
                    </p>

                    <div class="flex justify-center gap-2">
                      <Badge variant="outline" size="sm">
                        .safetensors
                      </Badge>
                      <Badge variant="outline" size="sm">
                        .json
                      </Badge>
                    </div>
                  </div>

                  <div class="pt-4">
                    <button class="btn btn-primary btn-lg">Browse Files</button>
                  </div>
                </div>
              </Show>
            </div>

            {/* Error Display */}
            <Show when={error()}>
              <div class="alert alert-error">
                <span class="size-6 icon-[famicons--alert-circle-outline]"></span>
                <span>{error()}</span>
              </div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <footer class="bg-base-100 border-t border-base-300">
        <div class="max-w-7xl w-full mx-auto px-4 py-8 overflow-hidden">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="text-center md:text-left">
              <h3 class="font-semibold text-base-content mb-1">
                Safetensors Inspector
              </h3>
              <p class="text-sm text-base-content/60">
                Open source tool for analyzing safetensors model files
              </p>
            </div>

            <div class="flex items-center gap-4">
              <a
                href="https://github.com/SegaraRai/safetensors-inspector"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-outline btn-sm gap-2"
              >
                <span
                  role="none"
                  class="size-5 icon-[famicons--logo-github]"
                ></span>
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
