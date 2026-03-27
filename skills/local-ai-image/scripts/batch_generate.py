#!/usr/bin/env python3
"""
Batch generate multiple images from a list of prompts.
Supports both LocalAI and ComfyUI backends.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict

# Import generation functions
sys.path.insert(0, str(Path(__file__).parent))
from generate_localai import generate_with_requests as generate_localai
from generate_comfy import generate as generate_comfy


def load_prompts(prompts_file: str) -> List[str]:
    """Load prompts from file (one per line)."""
    with open(prompts_file) as f:
        return [line.strip() for line in f if line.strip()]


def generate_single_localai(
    prompt: str,
    index: int,
    output_dir: Path,
    model: str,
    width: int,
    height: int,
    steps: int
) -> Dict:
    """Generate single image with LocalAI."""
    output_path = output_dir / f"image_{index:04d}.png"
    
    try:
        result = generate_localai(
            prompt=prompt,
            model=model,
            width=width,
            height=height,
            steps=steps,
            output=str(output_path)
        )
        return {"success": True, "prompt": prompt, "output": result}
    except Exception as e:
        return {"success": False, "prompt": prompt, "error": str(e)}


def generate_single_comfy(
    prompt: str,
    index: int,
    output_dir: Path,
    workflow: str,
    base_url: str
) -> Dict:
    """Generate single image with ComfyUI."""
    output_path = output_dir / f"image_{index:04d}.png"
    
    try:
        result = generate_comfy(
            workflow_path=workflow,
            prompt=prompt,
            base_url=base_url,
            output=str(output_path)
        )
        return {"success": True, "prompt": prompt, "output": result}
    except Exception as e:
        return {"success": False, "prompt": prompt, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Batch generate images from prompt list"
    )
    parser.add_argument(
        "--prompts", "-p",
        required=True,
        help="File containing prompts (one per line)"
    )
    parser.add_argument(
        "--backend",
        choices=["localai", "comfy"],
        default="localai",
        help="Generation backend to use"
    )
    parser.add_argument(
        "--count", "-n",
        type=int,
        default=1,
        help="Images per prompt (default: 1)"
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="./batch_output",
        help="Output directory (default: ./batch_output)"
    )
    parser.add_argument(
        "--model", "-m",
        default="sdxl",
        help="Model for LocalAI (default: sdxl)"
    )
    parser.add_argument(
        "--workflow", "-w",
        default="sdxl_basic",
        help="Workflow for ComfyUI (default: sdxl_basic)"
    )
    parser.add_argument(
        "--width", "-W",
        type=int,
        default=1024
    )
    parser.add_argument(
        "--height", "-H",
        type=int,
        default=1024
    )
    parser.add_argument(
        "--steps", "-s",
        type=int,
        default=30
    )
    parser.add_argument(
        "--parallel",
        type=int,
        default=1,
        help="Parallel generations (default: 1)"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0,
        help="Delay between requests in seconds (default: 0)"
    )
    
    args = parser.parse_args()
    
    # Load prompts
    prompts = load_prompts(args.prompts)
    print(f"Loaded {len(prompts)} prompts")
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Build job list
    jobs = []
    for i, prompt in enumerate(prompts):
        for j in range(args.count):
            jobs.append({
                "prompt": prompt,
                "index": i * args.count + j
            })
    
    print(f"Total images to generate: {len(jobs)}")
    print(f"Backend: {args.backend}")
    print(f"Parallel: {args.parallel}")
    print()
    
    # Generate
    results = []
    
    if args.parallel > 1:
        # Parallel generation
        with ThreadPoolExecutor(max_workers=args.parallel) as executor:
            futures = {}
            
            for job in jobs:
                if args.backend == "localai":
                    future = executor.submit(
                        generate_single_localai,
                        job["prompt"],
                        job["index"],
                        output_dir,
                        args.model,
                        args.width,
                        args.height,
                        args.steps
                    )
                else:
                    future = executor.submit(
                        generate_single_comfy,
                        job["prompt"],
                        job["index"],
                        output_dir,
                        args.workflow,
                        "http://localhost:8188"
                    )
                futures[future] = job
            
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                
                if result["success"]:
                    print(f"✓ [{result['output']}]")
                else:
                    print(f"✗ Failed: {result['error'][:50]}")
    else:
        # Sequential generation
        for job in jobs:
            if args.delay > 0:
                time.sleep(args.delay)
            
            print(f"Generating {job['index'] + 1}/{len(jobs)}...", end=" ")
            
            if args.backend == "localai":
                result = generate_single_localai(
                    job["prompt"],
                    job["index"],
                    output_dir,
                    args.model,
                    args.width,
                    args.height,
                    args.steps
                )
            else:
                result = generate_single_comfy(
                    job["prompt"],
                    job["index"],
                    output_dir,
                    args.workflow,
                    "http://localhost:8188"
                )
            
            results.append(result)
            
            if result["success"]:
                print(f"✓")
            else:
                print(f"✗ {result['error'][:50]}")
    
    # Summary
    successful = sum(1 for r in results if r["success"])
    failed = len(results) - successful
    
    print()
    print("=" * 50)
    print(f"Batch complete: {successful} success, {failed} failed")
    print(f"Output directory: {output_dir}")
    
    # Save metadata
    metadata = {
        "backend": args.backend,
        "model": args.model if args.backend == "localai" else args.workflow,
        "total": len(results),
        "successful": successful,
        "failed": failed,
        "results": results
    }
    
    with open(output_dir / "batch_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
