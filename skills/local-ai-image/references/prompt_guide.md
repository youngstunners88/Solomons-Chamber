# Prompt Engineering Guide for Local AI Image Generation

## Prompt Structure

The most effective prompts follow this structure:

```
[Subject], [Style/Medium], [Details], [Lighting], [Composition], [Quality Boosters]
```

### Example

```
ethereal warrior princess, digital art, intricate armor with glowing runes, 
misty forest background, rim lighting, highly detailed, 8k, masterpiece
```

## Subject

**What to include:**
- Main subject (person, object, scene)
- Action or pose
- Attributes (color, size, texture)

**Examples:**
- "futuristic cityscape"
- "elderly wizard casting spell"
- "mechanical dragon"

## Style / Medium

**Common styles:**

| Style | Trigger Words |
|-------|---------------|
| Photorealistic | `photorealistic, 8k, RAW photo, DSLR, shot on Canon EOS R5` |
| Digital Art | `digital art, concept art, trending on artstation, CGSociety` |
| Anime | `anime style, studio ghibli, cel shaded, manga style` |
| Oil Painting | `oil painting, impasto, classical art, renaissance style` |
| Watercolor | `watercolor painting, fluid art, soft edges` |
| Cyberpunk | `cyberpunk, neon lights, futuristic, dystopian, blade runner` |
| Fantasy | `fantasy art, magical, ethereal, Lord of the Rings style` |
| 3D Render | `3D render, octane render, unreal engine, cinema 4D` |
| Pixel Art | `pixel art, 16-bit, retro game style` |

## Details

**Add specificity:**
- Clothing: `wearing leather armor, business suit, flowing dress`
- Environment: `mountain peak, underwater, space station`
- Materials: `made of chrome, crystal, wood, fabric`
- Patterns: `geometric patterns, floral motifs, tribal designs`

## Lighting

**Lighting styles:**

| Lighting | Description |
|----------|-------------|
| `golden hour` | Warm sunset/sunrise light |
| `blue hour` | Cool twilight lighting |
| `rim lighting` | Light from behind subject |
| `studio lighting` | Professional even lighting |
| `volumetric lighting` | Light rays through atmosphere |
| `neon lighting` | Colored artificial lights |
| `candlelight` | Warm, flickering light |
| `chiaroscuro` | Strong light/dark contrast |

## Composition

**Camera and framing:**
- `wide shot, medium shot, close-up, extreme close-up`
- `portrait orientation, landscape orientation`
- `bird's eye view, worm's eye view, Dutch angle`
- `rule of thirds, centered, symmetrical`
- `shallow depth of field, deep focus`

## Quality Boosters

**Append these for better quality:**

```
highly detailed, 8k, masterpiece, best quality, sharp focus, 
intricate details, professional, award winning
```

## Negative Prompts

**Universal negative:**
```
blurry, low quality, distorted, watermark, signature, text, cropped, 
bad anatomy, deformed, ugly, duplicate, morbid, extra limbs, 
fused fingers, mutated hands, poorly drawn hands, mutation
```

**Style-specific:**

| Style | Add to Negative |
|-------|-----------------|
| Photorealistic | `painting, drawing, illustration, 3d render` |
| Digital Art | `photo, realistic, 3d render` |
| Anime | `3d, realistic, photo, western cartoon` |

## Prompt Examples by Use Case

### Portrait
```
professional headshot of a confident businesswoman, studio lighting, 
neutral background, wearing navy blazer, sharp focus, 8k, photorealistic
```

### Landscape
```
misty mountain valley at sunrise, golden hour lighting, pine trees in foreground, 
river reflecting sky, atmospheric perspective, highly detailed, 8k, landscape photography
```

### Product
```
sleek wireless headphones on marble surface, product photography, 
soft studio lighting, minimalist composition, reflection on surface, 
commercial photography style, 8k, sharp details
```

### Character
```
cyberpunk street samurai, neon-lit alley background, reflective visor, 
high-tech armor with glowing circuits, dynamic pose, rain effects, 
digital art, highly detailed, 8k, concept art
```

### Architecture
```
futuristic eco-friendly skyscraper, vertical gardens, glass facade, 
sunset lighting, surrounded by clouds, sustainable architecture, 
3d render, octane render, highly detailed
```

## Model-Specific Tips

### SDXL (1024x1024)
- Works best at native 1024x1024 resolution
- Natural language prompts work well
- Good at following complex compositions

### Flux (1024x1024)
- Excellent text understanding
- Fewer steps needed (4-8 steps)
- Best quality but slower

### SD 1.5 (512x512)
- Classic, well-tested
- Huge ecosystem of LoRAs
- Good for specific styles with custom models

### SDXL Turbo (512x512)
- Extremely fast (1-4 steps)
- Lower quality but great for prototyping
- Use CFG scale 1-2

## Advanced Techniques

### Weighting
```
(masterpiece:1.2), (best quality:1.1), (detailed armor:1.3), landscape
```

Higher numbers = more emphasis

### Alternating
```
[blue | red] hair
```
Alternates between options during generation

### Scheduling
```
[detailed armor::0.5] then [glowing runes::0.8]
```
Changes emphasis at different steps

### Combining Concepts
```
a (robot:0.8) (dragon:0.6), mechanical wings, cybernetic enhancements
```
Blends multiple concepts

## Batch Prompts File Format

For use with `batch_generate.py`:

```
# Lines starting with # are comments

futuristic city at sunset, cyberpunk, neon lights, highly detailed
ethereal forest with glowing mushrooms, fantasy art, magical atmosphere
professional headshot of a developer, studio lighting, confident expression
mechanical dragon in flight, steampunk style, intricate gears
underwater city ruins, bioluminescent creatures, mysterious atmosphere
```

One prompt per line. Save as `prompts.txt` and run:

```bash
python3 batch_generate.py --prompts prompts.txt --count 3
```
