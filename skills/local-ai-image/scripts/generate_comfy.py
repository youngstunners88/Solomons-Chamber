#!/usr/bin/env python3
"""
Generate images using ComfyUI via JSON workflow API.
Post workflow JSON to ComfyUI and retrieve generated image.
"""

import argparse
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Dict, Optional

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.parse

# Default configuration
DEFAULT_URL = "http://localhost:8188"


def get_workflow_template(name: str) -> Optional[Dict]:
    """Load a workflow template by name."""
    templates_dir = Path(__file__).parent.parent / "workflows"
    
    # Try exact match first
    template_path = templates_dir / f"{name}.json"
    if template_path.exists():
        with open(template_path) as f:
            return json.load(f)
    
    # Try with common extensions
    for ext in [".json", "_basic.json", "_detailed.json"]:
        template_path = templates_dir / f"{name}{ext}"
        if template_path.exists():
            with open(template_path) as f:
                return json.load(f)
    
    return None


def queue_workflow(
    workflow: Dict,
    base_url: str = DEFAULT_URL
) -> str:
    """Queue a workflow in ComfyUI and return prompt ID."""
    
    url = f"{base_url}/prompt"
    payload = {"prompt": workflow}
    
    if HAS_REQUESTS:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
    else:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
    
    return result.get("prompt_id")


def get_history(
    prompt_id: str,
    base_url: str = DEFAULT_URL
) -> Dict:
    """Get execution history for a prompt."""
    
    url = f"{base_url}/history/{prompt_id}"
    
    if HAS_REQUESTS:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    else:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())


def wait_for_completion(
    prompt_id: str,
    base_url: str = DEFAULT_URL,
    timeout: int = 300,
    poll_interval: float = 1.0
) -> Optional[Dict]:
    """Wait for workflow completion and return outputs."""
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        history = get_history(prompt_id, base_url)
        
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            if outputs:
                return outputs
        
        time.sleep(poll_interval)
    
    return None


def download_image(
    filename: str,
    subfolder: str = "",
    folder_type: str = "output",
    base_url: str = DEFAULT_URL,
    output_path: str = "output.png"
) -> str:
    """Download generated image from ComfyUI."""
    
    params = {"filename": filename}
    if subfolder:
        params["subfolder"] = subfolder
    if folder_type:
        params["type"] = folder_type
    
    if HAS_REQUESTS:
        url = f"{base_url}/view"
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        
        with open(output_path, "wb") as f:
            f.write(response.content)
    else:
        query = urllib.parse.urlencode(params)
        url = f"{base_url}/view?{query}"
        
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=60) as response:
            with open(output_path, "wb") as f:
                f.write(response.read())
    
    return output_path


def update_workflow_prompt(
    workflow: Dict,
    prompt: str,
    seed: Optional[int] = None
) -> Dict:
    """Update prompt and seed in workflow."""
    
    workflow = json.loads(json.dumps(workflow))  # Deep copy
    
    # Find and update prompt nodes (common patterns)
    for node_id, node in workflow.get("prompt", workflow).items():
        if isinstance(node, dict):
            inputs = node.get("inputs", {})
            
            # Update text/prompt inputs
            if "text" in inputs and isinstance(inputs["text"], str):
                if len(inputs["text"]) > 10:  # Likely the main prompt
                    inputs["text"] = prompt
            
            # Update seed if provided
            if seed is not None and "seed" in inputs:
                inputs["seed"] = seed
            elif seed is not None and "noise_seed" in inputs:
                inputs["noise_seed"] = seed
    
    return workflow


def generate(
    workflow_path: str,
    prompt: Optional[str] = None,
    seed: Optional[int] = None,
    base_url: str = DEFAULT_URL,
    output: str = "output.png",
    timeout: int = 300
) -> str:
    """Generate image using ComfyUI workflow."""
    
    # Load workflow
    if Path(workflow_path).exists():
        with open(workflow_path) as f:
            workflow = json.load(f)
    else:
        # Try as template name
        workflow = get_workflow_template(workflow_path)
        if workflow is None:
            raise ValueError(f"Workflow not found: {workflow_path}")
    
    # Update prompt if provided
    if prompt:
        workflow = update_workflow_prompt(workflow, prompt, seed)
    
    # Queue workflow
    print("Queueing workflow...")
    prompt_id = queue_workflow(workflow, base_url)
    print(f"  Prompt ID: {prompt_id}")
    
    # Wait for completion
    print("Waiting for generation...")
    outputs = wait_for_completion(prompt_id, base_url, timeout)
    
    if not outputs:
        raise TimeoutError("Generation timed out")
    
    # Download first output image
    for node_id, node_output in outputs.items():
        if "images" in node_output:
            image_info = node_output["images"][0]
            filename = image_info["filename"]
            subfolder = image_info.get("subfolder", "")
            
            print(f"Downloading {filename}...")
            return download_image(
                filename,
                subfolder,
                base_url=base_url,
                output_path=output
            )
    
    raise ValueError("No images in workflow output")


def list_workflows():
    """List available workflow templates."""
    templates_dir = Path(__file__).parent.parent / "workflows"
    
    if not templates_dir.exists():
        print("No workflow templates found")
        return
    
    print("Available workflows:")
    for f in sorted(templates_dir.glob("*.json")):
        print(f"  - {f.stem}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate images using ComfyUI workflows"
    )
    parser.add_argument(
        "--workflow", "-w",
        required=True,
        help="Path to workflow JSON or template name (use --list to see templates)"
    )
    parser.add_argument(
        "--prompt", "-p",
        help="Text prompt to inject into workflow"
    )
    parser.add_argument(
        "--seed",
        type=int,
        help="Random seed for reproducibility"
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_URL,
        help=f"ComfyUI base URL (default: {DEFAULT_URL})"
    )
    parser.add_argument(
        "--output", "-o",
        default="output.png",
        help="Output file path (default: output.png)"
    )
    parser.add_argument(
        "--timeout", "-t",
        type=int,
        default=300,
        help="Timeout in seconds (default: 300)"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available workflow templates"
    )
    
    args = parser.parse_args()
    
    if args.list:
        list_workflows()
        return
    
    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating image with ComfyUI...")
    print(f"  Workflow: {args.workflow}")
    if args.prompt:
        print(f"  Prompt: {args.prompt[:60]}...")
    
    try:
        result = generate(
            workflow_path=args.workflow,
            prompt=args.prompt,
            seed=args.seed,
            base_url=args.url,
            output=args.output,
            timeout=args.timeout
        )
        print(f"✓ Image saved: {result}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
