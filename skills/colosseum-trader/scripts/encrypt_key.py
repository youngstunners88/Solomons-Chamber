#!/usr/bin/env python3
"""
Encrypt private keys for secure storage.
Uses Fernet symmetric encryption.
"""

import argparse
import getpass
import os
import sys
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

def derive_key(password: str, salt: bytes) -> bytes:
    """Derive encryption key from password."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key

def encrypt_key(private_key: str, password: str) -> bytes:
    """Encrypt a private key with password."""
    # Generate random salt
    salt = os.urandom(16)
    
    # Derive key
    key = derive_key(password, salt)
    
    # Encrypt
    f = Fernet(key)
    encrypted = f.encrypt(private_key.encode())
    
    # Combine salt + encrypted
    return salt + encrypted

def decrypt_key(encrypted_data: bytes, password: str) -> str:
    """Decrypt a private key with password."""
    # Extract salt (first 16 bytes)
    salt = encrypted_data[:16]
    encrypted = encrypted_data[16:]
    
    # Derive key
    key = derive_key(password, salt)
    
    # Decrypt
    f = Fernet(key)
    decrypted = f.decrypt(encrypted)
    
    return decrypted.decode()

def main():
    parser = argparse.ArgumentParser(description="Encrypt/decrypt private keys")
    parser.add_argument("--input", "-i", required=True, help="Input file path")
    parser.add_argument("--output", "-o", required=True, help="Output file path")
    parser.add_argument("--decrypt", "-d", action="store_true", help="Decrypt mode")
    args = parser.parse_args()
    
    if args.decrypt:
        # Decrypt mode
        with open(args.input, "rb") as f:
            encrypted_data = f.read()
        
        password = getpass.getpass("Enter password: ")
        
        try:
            private_key = decrypt_key(encrypted_data, password)
            with open(args.output, "w") as f:
                f.write(private_key)
            print(f"✓ Decrypted to {args.output}")
            print("⚠️  Remember to delete the decrypted file when done!")
        except Exception as e:
            print(f"✗ Decryption failed: {e}")
            sys.exit(1)
    else:
        # Encrypt mode
        with open(args.input, "r") as f:
            private_key = f.read().strip()
        
        password = getpass.getpass("Enter encryption password: ")
        confirm = getpass.getpass("Confirm password: ")
        
        if password != confirm:
            print("✗ Passwords don't match")
            sys.exit(1)
        
        encrypted = encrypt_key(private_key, password)
        
        with open(args.output, "wb") as f:
            f.write(encrypted)
        
        print(f"✓ Encrypted to {args.output}")
        print(f"✓ Original file NOT deleted: {args.input}")
        print("⚠️  Delete the original file manually when ready!")

if __name__ == "__main__":
    main()
