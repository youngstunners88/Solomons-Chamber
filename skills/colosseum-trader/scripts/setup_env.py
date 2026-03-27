#!/usr/bin/env python3
"""
Interactive setup for .env file.
Helps users securely configure their API keys.
"""

import os
import sys
from pathlib import Path

SKILL_DIR = Path.home() / "skills" / "colosseum-trader"
ENV_TEMPLATE = SKILL_DIR / "config" / ".env.example"
ENV_FILE = SKILL_DIR / "config" / ".env"

def main():
    print("=" * 60)
    print("Colosseum Trader - Environment Setup")
    print("=" * 60)
    print()
    
    # Check if .env already exists
    if ENV_FILE.exists():
        print(f"⚠️  .env already exists at {ENV_FILE}")
        response = input("Overwrite? (yes/no): ")
        if response.lower() != "yes":
            print("Setup cancelled.")
            return
    
    # Read template
    with open(ENV_TEMPLATE) as f:
        template = f.read()
    
    print("Enter your API keys (press Enter to skip):")
    print("-" * 60)
    
    # Extract key names from template
    import re
    keys = re.findall(r'^(\w+)=', template, re.MULTILINE)
    
    # Build new .env content
    new_env = []
    
    for line in template.split('\n'):
        if line.startswith('#') or not line.strip():
            new_env.append(line)
            continue
        
        # Check if this is a key line
        match = re.match(r'^(\w+)=', line)
        if match:
            key_name = match.group(1)
            
            # Skip certain keys
            if 'EXAMPLE' in key_name or 'TEMPLATE' in key_name:
                new_env.append(line)
                continue
            
            # Get current value (after =)
            current_value = line.split('=', 1)[1] if '=' in line else ''
            
            # Prompt for value
            print(f"\n{key_name}:")
            if 'PRIVATE_KEY' in key_name or 'SECRET' in key_name or 'PASSWORD' in key_name:
                import getpass
                value = getpass.getpass(f"  Enter value (hidden): ")
            else:
                value = input(f"  Enter value [{current_value}]: ").strip()
            
            if value:
                new_env.append(f"{key_name}={value}")
            else:
                new_env.append(line)
        else:
            new_env.append(line)
    
    # Write .env file
    env_content = '\n'.join(new_env)
    
    with open(ENV_FILE, 'w') as f:
        f.write(env_content)
    
    # Set secure permissions
    os.chmod(ENV_FILE, 0o600)
    
    print()
    print("=" * 60)
    print("✓ Environment file created!")
    print(f"  Location: {ENV_FILE}")
    print(f"  Permissions: 600 (owner read/write only)")
    print()
    print("IMPORTANT:")
    print("  1. This file is in .gitignore - NEVER commit it")
    print("  2. Back up this file securely (password manager)")
    print("  3. Use testnet keys for development")
    print()
    print("Next steps:")
    print("  1. Review the file: nano ~/skills/colosseum-trader/config/.env")
    print("  2. Test with: python3 -c \"from dotenv import load_dotenv; load_dotenv('~/skills/colosseum-trader/config/.env'); print('OK')\"")
    print()

if __name__ == "__main__":
    main()
