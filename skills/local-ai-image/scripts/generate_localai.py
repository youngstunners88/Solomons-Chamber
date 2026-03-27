#!/usr/bin/env python3
"""
Generate images using LocalAI's OpenAI-compatible API.
Drop-in replacement for OpenAI - just change base_url to localhost:8080
"""

import argparse
import base64
import os
import sys
import json
from pathlib import Path
from typing import Optional

# Try to use openai package, fallback to requests
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    import urllib.request
    import urllib.parse

# Default configuration
DEFAULT_URL = "http://localhost:8080/v1"
DEFAULT_API_KEY = "sk-local"
DEFAULT_MODEL = "sdxl"


def load_config():
    """Load configuration from config file."""
    config_path = Path(__file__).parent.parent / "config" / "localai.yaml"
    if config_path.exists():
        try:
            import yaml
            with open(config_path) as f:
                return yaml.safe_load(f)
        except:
            pass
    return {}


def generate_with_openai(
    prompt: str,
    negative_prompt: str = "",
    model: str = DEFAULT_MODEL,
    width: int = 1024,
    height: int = 1024,
    steps: int = 30,
    cfg: float = 7.5,
    seed: Optional[int] = None,
    base_url: str = DEFAULT_URL,
    api_key: str = DEFAULT_API_KEY,
    output: str = "output.png"
) -> str:
    """Generate image using OpenAI client."""
    
    client = OpenAI(
        base_url=base_url,
        api_key=api_key
    )
    
    # Build parameters
    params = {
        "model": model,
        "prompt": prompt,
        "size": f"{width}x{height}",
        "n": 1,
        "response_format": "b64_json"
    }
    
    # Add optional parameters for LocalAI
    extra_body = {
        "steps": steps,
        "cfg_scale": cfg,
    }
    if negative_prompt:
        extra_body["negative_prompt"] = negative_prompt
    if seed is not None:
        extra_body["seed"] = seed
    
    try:
        response = client.images.generate(
            **params,
            extra_body=extra_body
        )
        
        # Save image
        image_data = base64.b64decode(response.data[0].b64_json)
        with open(output, "wb") as f:
            f.write(image_data)
        
        return output
        
    except Exception as e:
        print(f"Error generating image: {e}")
        raise


def generate_with_requests(
    prompt: str,
    negative_prompt: str = "",
    model: str = DEFAULT_MODEL,
    width: int = 1024,
    height: int = 1024,
    steps: int = 30,
    cfg: float = 7.5,
    seed: Optional[int] = None,
    base_url: str = DEFAULT_URL,
    api_key: str = DEFAULT_API_KEY,
    output: str = "output.png"
) -> str:
    """Generate image using raw HTTP requests (no openai package)."""
    
    url = f"{base_url}/images/generations"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": model,
        "prompt": prompt,
        "size": f"{width}x{height}",
        "n": 1,
        "response_format": "b64_json",
        "steps": steps,
        "cfg_scale": cfg
    }
    
    if negative_prompt:
        payload["negative_prompt"] = negative_prompt
    if seed is not None:
        payload["seed"] = seed
    
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            url,
            data=data,
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=300) as response:
            result = json.loads(response.read().decode())
        
        # Save image
        image_data = base64.b64decode(result["data"][0]["b64_json"])
        with open(output, "wb") as f:
            f.write(image_data)
        
        return output
        
    except Exception as e:
        print(f"Error generating image: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description="Generate images using LocalAI"
    )
    parser.add_argument(
        "--prompt", "-p",
        required=True,
        help="Text prompt for image generation"
    )
    parser.add_argument(
        "--negative", "-n",
        default="",
        help="Negative prompt (things to avoid)"
    )
    parser.add_argument(
        "--model", "-m",
        default=DEFAULT_MODEL,
        help=f"Model to use (default: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--width", "-W",
        type=int,
        default=1024,
        help="Image width (default: 1024)"
    )
    parser.add_argument(
        "--height", "-H",
        type=int,
        default=1024,
        help="Image height (default: 1024)"
    )
    parser.add_argument(
        "--steps", "-s",
        type=int,
        default=30,
        help="Inference steps (default: 30)"
    )
    parser.add_argument(
        "--cfg", "-c",
        type=float,
        default=7.5,
        help="CFG scale (default: 7.5)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        help="Random seed for reproducibility"
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_URL,
        help=f"LocalAI base URL (default: {DEFAULT_URL})"
    )
    parser.add_argument(
        "--output", "-o",
        default="output.png",
        help="Output file path (default: output.png)"
    )
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating image with LocalAI...")
    print(f"  Prompt: {args.prompt[:60]}...")
    print(f"  Model: {args.model}")
    print(f"  Size: {args.width}x{args.height}")
    
    try:
        if HAS_OPENAI:
            result = generate_with_openai(
                prompt=args.prompt,
                negative_prompt=args.negative,
                model=args.model,
                width=args.width,
                height=args.height,
                steps=args.steps,
                cfg=args.cfg,
                seed=args.seed,
                base_url=args.url,
                output=args.output
            )
        else:
            print("Note: Using requests (install 'openai' package for better experience)")
            result = generate_with_requests(
                prompt=args.prompt,
                negative_prompt=args.negative,
                model=args.model,
                width=args.width,
                height=args.height,
                steps=args.steps,
                cfg=args.cfg,
                seed=args.seed,
                base_url=args.url,
                output=args.output
            )
        
        print(f"✓ Image saved: {result}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
