/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - ADDRESS VALUE OBJECT
 * ═══════════════════════════════════════════════════════════════
 */

export class Address {
  private readonly value: string;

  constructor(address: string) {
    if (!Address.isValid(address)) {
      throw new Error(`Invalid Ethereum address: ${address}`);
    }
    this.value = address.toLowerCase();
  }

  static isValid(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Address): boolean {
    return this.value === other.value;
  }

  checksum(): string {
    // Simplified checksum - in production use ethers.getAddress
    return this.value;
  }
}
