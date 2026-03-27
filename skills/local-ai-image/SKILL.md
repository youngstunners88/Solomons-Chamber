---
name: local-ai-image
description: Generate images using LocalAI (OpenAI-compatible API) and ComfyUI (node-based SD workflows). Use when Kimi needs to create images, artwork, diagrams, or visual content using local AI models like SDXL, Flux, Stable Diffusion. Supports text-to-image, image-to-image, and advanced pipeline control via ComfyUI JSON workflows.
---

# Local AI Image Generation Skill

Generate images using local AI models through LocalAI and ComfyUI.

## Two Approaches

| Approach | Best For | Complexity | Speed |
|----------|----------|------------|-------|
| **LocalAI** | Quick generation, OpenAI compatibility | Low | Fast |
| **ComfyUI** | Advanced pipelines, fine control | High | Flexible |

## LocalAI (OpenAI-Compatible)

Drop-in replacement for OpenAI's image API. Just change `base_url` to `http://localhost:8080`.

### Supported Models

- **SDXL** - High quality 1024x1024 images
- **Flux** - Latest state-of-the-art
- **Stable Diffusion** - Classic 512x512
- **Custom models** - Any GGUF/Safetensors

### Installation

```bash
# Docker (recommended)
docker run -p 8080:8080 -v $PWD/models:/models localai/localai:latest

# Or download from https://github.com/mudler/LocalAI
```

### Quick Generate

```bash
# Using the skill script
python3 ~/skills/local-ai-image/scripts/generate_localai.py \
  --prompt "futuristic city at sunset, cyberpunk, neon lights" \
  --model sdxl \
  --output ~/images/city.png
```

### API Usage

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="sk-local"  # LocalAI doesn't need real key
)

response = client.images.generate(
    model="sdxl",
    prompt="a robot painting a landscape",
    size="1024x1024",
    n=1
)

print(response.data[0].url)
```

## ComfyUI (Node-Based Workflows)

Full pipeline control with JSON workflows. Each workflow is a node graph saved as JSON.

### Installation

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt
python main.py  # Runs on localhost:8188
```

### How It Works

1. **Design workflow** in ComfyUI web interface (or use templates)
2. **Save as JSON** - the workflow file
3. **POST to API** - agents send workflow JSON, get image back

### Quick Generate

```bash
# Using workflow template
python3 ~/skills/local-ai-image/scripts/generate_comfy.py \
  --workflow workflows/sdxl_basic.json \
  --prompt "ethereal forest with glowing mushrooms" \
  --output ~/images/forest.png
```

### API Usage

```python
import requests
import json

# Load workflow
with open("workflows/sdxl_basic.json") as f:
    workflow = json.load(f)

# Update prompt in workflow
workflow["prompt"]["6"]["inputs"]["text"] = "your prompt here"

# Queue workflow
response = requests.post(
    "http://localhost:8188/prompt",
    json={"prompt": workflow}
)

# Get image from response
result = response.json()
```

## Usage Patterns

### Pattern 1: Quick Image (LocalAI)

When you need an image fast with standard settings:

```bash
python3 ~/skills/local-ai-image/scripts/generate_localai.py \
  --prompt "professional headshot of a developer" \
  --negative "blurry, low quality" \
  --width 512 --height 512 \
  --steps 20 \
  --output ./headshot.png
```

### Pattern 2: Advanced Control (ComfyUI)

When you need specific pipeline control:

```bash
python3 ~/skills/local-ai-image/scripts/generate_comfy.py \
  --workflow workflows/flux_detailed.json \
  --prompt "hyperrealistic portrait" \
  --seed 42 \
  --cfg 7.5 \
  --steps 50 \
  --output ./portrait.png
```

### Pattern 3: Batch Generation

Generate multiple variations:

```bash
python3 ~/skills/local-ai-image/scripts/batch_generate.py \
  --prompts "prompts.txt" \
  --count 10 \
  --output-dir ./batch/
```

### Pattern 4: Image-to-Image

Transform existing images:

```bash
# LocalAI
python3 ~/skills/local-ai-image/scripts/img2img_localai.py \
  --image ./input.png \
  --prompt "convert to oil painting style" \
  --strength 0.7 \
  --output ./painting.png

# ComfyUI
python3 ~/skills/local-ai-image/scripts/img2img_comfy.py \
  --workflow workflows/img2img_controlnet.json \
  --image ./input.png \
  --prompt "cyberpunk style" \
  --output ./cyberpunk.png
```

## Workflow Templates

Pre-built ComfyUI workflows in `workflows/`:

| Workflow | Description | Best For |
|----------|-------------|----------|
| `sdxl_basic.json` | Standard SDXL pipeline | Quick quality images |
| `flux_basic.json` | Flux pipeline | Best quality, slower |
| `sdxl_upscale.json` | SDXL + 4x upscaler | High resolution |
| `img2img_controlnet.json` | Image transform with ControlNet | Style transfer, poses |
| `inpainting.json` | Masked editing | Object removal/addition |
| `batch_variations.json` | Multi-seed batch | A/B testing prompts |

## Configuration

### LocalAI Config

Edit `~/skills/local-ai-image/config/localai.yaml`:

```yaml
base_url: http://localhost:8080
api_key: sk-local
models:
  sdxl: stabilityai/stable-diffusion-xl-base-1.0
  flux: black-forest-labs/FLUX.1-schnell
  sd15: runwayml/stable-diffusion-v1-5
```

### ComfyUI Config

Edit `~/skills/local-ai-image/config/comfyui.yaml`:

```yaml
base_url: http://localhost:8188
output_dir: ./output
models_dir: /path/to/ComfyUI/models
workflows_dir: ./workflows
```

## Prompt Engineering

### Effective Prompts

```
# Structure
[Subject], [Style/Medium], [Details], [Lighting], [Quality boosters]

# Example
"ethereal warrior princess, digital art, intricate armor with glowing runes, 
misty forest background, rim lighting, highly detailed, 8k, masterpiece"

# Quality boosters to append
", highly detailed, 8k, masterpiece, best quality, sharp focus"

# Negative prompt
"blurry, low quality, distorted, watermark, signature, text, cropped"
```

### Style Reference

| Style | Trigger Words |
|-------|---------------|
| Photorealistic | "photorealistic, 8k, RAW photo, DSLR" |
| Digital Art | "digital art, concept art, trending on artstation" |
| Anime | "anime style, studio ghibli, cel shaded" |
| Oil Painting | "oil painting, impasto, classical art" |
| Cyberpunk | "cyberpunk, neon lights, futuristic, dystopian" |

## Scripts Reference

### generate_localai.py

```bash
python3 scripts/generate_localai.py \
  --prompt "your prompt" \          # Required
  --negative "things to avoid" \    # Optional
  --model sdxl \                   # sdxl | flux | sd15
  --width 1024 \                   # Image width
  --height 1024 \                  # Image height
  --steps 30 \                     # Inference steps
  --cfg 7.5 \                      # CFG scale
  --seed 42 \                      # Reproducibility
  --output ./image.png             # Output path
```

### generate_comfy.py

```bash
python3 scripts/generate_comfy.py \
  --workflow workflows/sdxl.json \ # Workflow JSON
  --prompt "your prompt" \          # Injected into workflow
  --seed 42 \                      # Random seed
  --output ./image.png             # Output path
```

### batch_generate.py

```bash
python3 scripts/batch_generate.py \
  --prompts prompts.txt \          # File with one prompt per line
  --backend localai \              # localai | comfy
  --count 10 \                     # Images per prompt
  --output-dir ./batch/            # Output directory
```

## Troubleshooting

### LocalAI Connection Refused

```bash
# Check if running
curl http://localhost:8080/v1/models

# Start with Docker
docker run -p 8080:8080 localai/localai:latest
```

### ComfyUI Workflow Errors

```bash
# Validate workflow JSON
python3 scripts/validate_workflow.py workflows/yours.json

# Check node types exist in ComfyUI
python3 scripts/list_nodes.py
```

### Out of Memory

```bash
# Reduce batch size or resolution
--width 512 --height 512

# Use optimized models
--model sdxl-turbo  # 1-4 steps instead of 20-50
```

## Integration Examples

### With Trading Bot (Generate Charts)

```python
from skills.local_ai_image.scripts.generate_localai import generate

chart = generate(
    prompt="candlestick chart showing bull run, green candles, technical indicators",
    width=1920,
    height=1080,
    output="./chart.png"
)
```

### With Agent System (Visual Reports)

```python
# In your agent code
from skills.local_ai_image.scripts.generate_comfy import generate_with_workflow

# Generate infographic
infographic = generate_with_workflow(
    workflow="workflows/infographic.json",
    data=agent_report_data,
    output="./report_visual.png"
)
```

## Resources

- LocalAI: https://github.com/mudler/LocalAI
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- ComfyUI Workflows: https://comfyworkflows.com/
- Prompt Library: `references/prompt_library.md`
