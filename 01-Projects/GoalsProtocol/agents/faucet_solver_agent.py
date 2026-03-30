#!/usr/bin/env python3
"""
🤖 Faucet Solver Agent - Automated Testnet ETH Acquisition

A multi-strategy agent for acquiring testnet ETH from faucets.
Supports browser automation, CAPTCHA detection, AI vision analysis,
and human-in-the-loop fallback.

Strategies (in order):
1. API-based faucets (no browser needed)
2. Browser automation for simple forms
3. Screenshot + AI vision for image CAPTCHAs
4. External CAPTCHA solving services (2captcha, etc.)
5. Human-in-the-loop for unsolvable CAPTCHAs
"""

import asyncio
import json
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Callable

import requests
from playwright.async_api import async_playwright, Page, Browser

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class FaucetConfig:
    name: str
    url: str
    network: str  # "base-sepolia", "sepolia", etc.
    type: str  # "api", "form", "twitter", "github", "pow"
    expected_amount: str
    cooldown_hours: int = 24
    requires_captcha: bool = True
    captcha_type: str = "unknown"  # "none", "recaptcha", "hcaptcha", "turnstile", "image", "pow"
    requires_login: bool = False
    login_type: str = "none"  # "none", "wallet", "github", "twitter", "email"
    form_fields: Dict[str, str] = field(default_factory=dict)
    submit_selector: str = ""
    success_indicator: str = ""
    enabled: bool = True


@dataclass
class SolveResult:
    success: bool
    strategy: str
    amount_received: str = "0"
    tx_hash: str = ""
    error: str = ""
    screenshot_path: str = ""
    captcha_detected: bool = False
    captcha_type: str = ""
    human_required: bool = False
    duration_seconds: float = 0.0


class FaucetSolverAgent:
    """
    Intelligent agent for solving faucet challenges and acquiring testnet ETH.
    Supports headless automation, browser profiles, and CDP connection to
    leverage existing logged-in sessions.
    """

    def __init__(
        self,
        target_address: str,
        headless: bool = True,
        profile: Optional[str] = None,
        connect: bool = False,
        cdp_url: Optional[str] = None,
    ):
        self.target_address = target_address
        self.headless = headless
        self.profile = profile
        self.connect = connect
        self.cdp_url = cdp_url
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.results: List[SolveResult] = []
        self.screenshot_dir = Path(__file__).parent.parent / "screenshots"
        self.screenshot_dir.mkdir(exist_ok=True)

        # CAPTCHA solving service configs
        self.captcha_api_key = os.getenv("CAPTCHA_API_KEY", "")
        self.captcha_service = os.getenv("CAPTCHA_SERVICE", "2captcha")

        # Faucet registry
        self.faucets = self._build_faucet_registry()

    def _build_faucet_registry(self) -> List[FaucetConfig]:
        """Build the registry of known faucets."""
        return [
            FaucetConfig(
                name="Coinbase Base Sepolia",
                url="https://portal.cdp.coinbase.com/products/faucet",
                network="base-sepolia",
                type="form",
                expected_amount="0.1 ETH",
                requires_captcha=True,
                captcha_type="turnstile",
                requires_login=True,
                login_type="wallet",
                form_fields={"address": "input[type='text']"},
                submit_selector="button[type='submit']",
                success_indicator="success",
                enabled=True,
            ),
            FaucetConfig(
                name="Alchemy Sepolia",
                url="https://sepoliafaucet.com/",
                network="sepolia",
                type="form",
                expected_amount="0.5 ETH",
                requires_captcha=True,
                captcha_type="recaptcha",
                requires_login=True,
                login_type="email",
                enabled=True,
            ),
            FaucetConfig(
                name="QuickNode Base Sepolia",
                url="https://faucet.quicknode.com/base/sepolia",
                network="base-sepolia",
                type="form",
                expected_amount="0.05 ETH",
                requires_captcha=True,
                captcha_type="turnstile",
                requires_login=False,
                enabled=True,
            ),
            FaucetConfig(
                name="Google Cloud Sepolia",
                url="https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
                network="sepolia",
                type="form",
                expected_amount="0.05 ETH",
                requires_captcha=True,
                captcha_type="recaptcha",
                requires_login=True,
                login_type="google",
                enabled=True,
            ),
            FaucetConfig(
                name="Infura Sepolia",
                url="https://www.infura.io/faucet/sepolia",
                network="sepolia",
                type="form",
                expected_amount="0.5 ETH",
                requires_captcha=True,
                captcha_type="recaptcha",
                requires_login=True,
                login_type="email",
                enabled=True,
            ),
            FaucetConfig(
                name="PoW Faucet",
                url="https://sepolia-faucet.pk910.de/",
                network="sepolia",
                type="pow",
                expected_amount="0.05 ETH",
                requires_captcha=False,
                captcha_type="pow",
                enabled=False,  # Requires mining, complex
            ),
        ]

    async def init_browser(self):
        """Initialize the Playwright browser with stealth settings or profile."""
        if self.browser:
            return

        self.playwright = await async_playwright().start()

        # Option 1: Connect to existing Chrome via CDP (uses your logged-in sessions)
        if self.cdp_url:
            print(f"🔌 Connecting to Chrome at {self.cdp_url}...")
            self.browser = await self.playwright.chromium.connect_over_cdp(self.cdp_url)
            contexts = self.browser.contexts
            context = contexts[0] if contexts else await self.browser.new_context()
            self.page = await context.new_page()
            print("✅ Connected to existing Chrome via CDP")
            return

        if self.connect:
            print("🔌 Auto-discovering Chrome via CDP...")
            # Try common CDP ports
            for port in [9222, 9229, 9333]:
                try:
                    self.browser = await self.playwright.chromium.connect_over_cdp(
                        f"http://127.0.0.1:{port}"
                    )
                    contexts = self.browser.contexts
                    context = contexts[0] if contexts else await self.browser.new_context()
                    self.page = await context.new_page()
                    print(f"✅ Connected to Chrome on port {port}")
                    return
                except Exception:
                    continue
            print("⚠️  Could not auto-discover Chrome. Falling back to launch.")

        # Option 2: Use Chrome profile (preserves cookies/logins)
        if self.profile:
            print(f"👤 Using Chrome profile: {self.profile}")
            # Find Chrome executable
            chrome_paths = [
                "/usr/bin/google-chrome",
                "/usr/bin/chromium",
                "/usr/bin/chromium-browser",
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            ]
            chrome_path = None
            for path in chrome_paths:
                if os.path.exists(path):
                    chrome_path = path
                    break

            if not chrome_path:
                print("⚠️  Chrome not found, using Playwright Chromium instead")
                # Try to find profile path for Playwright Chromium
                profile_path = os.path.expanduser(f"~/.config/google-chrome/{self.profile}")
                if not os.path.exists(profile_path):
                    profile_path = os.path.expanduser(f"~/Library/Application Support/Google/Chrome/{self.profile}")
            else:
                # Determine profile path based on OS
                if sys.platform == "darwin":
                    profile_path = os.path.expanduser(f"~/Library/Application Support/Google/Chrome/{self.profile}")
                else:
                    profile_path = os.path.expanduser(f"~/.config/google-chrome/{self.profile}")

            browser_args = [
                f"--user-data-dir={profile_path}",
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ]

            self.browser = await self.playwright.chromium.launch(
                executable_path=chrome_path,
                headless=self.headless,
                args=browser_args,
            )
            context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
            )
            self.page = await context.new_page()
            print(f"✅ Browser initialized with profile: {self.profile}")
            return

        # Option 3: Standard stealth launch
        browser_args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
        ]

        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=browser_args,
        )

        context = await self.browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )

        # Remove webdriver property
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            window.chrome = { runtime: {} };
        """)

        self.page = await context.new_page()
        print("🌐 Browser initialized with stealth mode")

    async def close_browser(self):
        """Close the browser."""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        print("🌐 Browser closed")

    async def screenshot(self, name: str) -> str:
        """Take a screenshot and save it."""
        if not self.page:
            return ""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = self.screenshot_dir / f"{name}_{timestamp}.png"
        await self.page.screenshot(path=str(path), full_page=True)
        print(f"📸 Screenshot saved: {path}")
        return str(path)

    async def detect_captcha(self) -> Dict:
        """Detect CAPTCHA type on the current page."""
        if not self.page:
            return {"detected": False, "type": "none"}

        captcha_indicators = {
            "recaptcha": [
                '.g-recaptcha',
                '[data-sitekey]',
                'iframe[src*="recaptcha"]',
                '#recaptcha',
            ],
            "hcaptcha": [
                '.h-captcha',
                '[data-hcaptcha-sitekey]',
                'iframe[src*="hcaptcha"]',
            ],
            "turnstile": [
                '.cf-turnstile',
                '[data-sitekey]',
                'iframe[src*="challenges.cloudflare"]',
            ],
            "image": [
                'img[src*="captcha"]',
                '.captcha-image',
                '#captcha',
            ],
        }

        for captcha_type, selectors in captcha_indicators.items():
            for selector in selectors:
                try:
                    element = await self.page.query_selector(selector)
                    if element:
                        return {
                            "detected": True,
                            "type": captcha_type,
                            "selector": selector,
                        }
                except Exception:
                    continue

        # Check page text for CAPTCHA mentions
        page_text = await self.page.content()
        captcha_keywords = ["captcha", "verify you are human", "i'm not a robot"]
        for keyword in captcha_keywords:
            if keyword.lower() in page_text.lower():
                return {"detected": True, "type": "unknown", "selector": ""}

        return {"detected": False, "type": "none"}

    async def solve_with_ai_vision(self, screenshot_path: str) -> Dict:
        """
        Use AI vision to analyze a screenshot and determine next actions.
        This is a placeholder - in practice, you'd call a vision API.
        """
        print(f"🔍 Analyzing screenshot with AI vision: {screenshot_path}")

        # For now, we return a generic analysis
        # In a real implementation, this would call GPT-4V, Claude, etc.
        return {
            "can_solve": False,
            "analysis": "AI vision analysis requires multimodal model integration.",
            "recommended_action": "human_fallback",
            "form_fields": [],
            "captcha_text": "",
        }

    async def solve_with_captcha_service(self, captcha_type: str, site_url: str) -> Dict:
        """Solve CAPTCHA using external service like 2captcha."""
        if not self.captcha_api_key:
            return {"success": False, "error": "No CAPTCHA_API_KEY configured"}

        print(f"🔑 Attempting to solve {captcha_type} via {self.captcha_service}...")

        # This is a framework - actual implementation depends on service
        if self.captcha_service == "2captcha":
            return await self._solve_2captcha(captcha_type, site_url)

        return {"success": False, "error": f"Unsupported service: {self.captcha_service}"}

    async def _solve_2captcha(self, captcha_type: str, site_url: str) -> Dict:
        """2captcha integration framework."""
        # Framework only - requires actual API key and implementation
        api_key = self.captcha_api_key

        if captcha_type == "recaptcha":
            # Would need sitekey extraction
            return {"success": False, "error": "reCAPTCHA solving not implemented"}
        elif captcha_type == "hcaptcha":
            return {"success": False, "error": "hCaptcha solving not implemented"}

        return {"success": False, "error": f"CAPTCHA type {captcha_type} not supported by service"}

    async def try_faucet_api(self, faucet: FaucetConfig) -> SolveResult:
        """Try to get ETH via API (no browser)."""
        start = time.time()
        print(f"\n🚰 Trying API strategy for {faucet.name}...")

        # Most modern faucets don't have public APIs
        # This is where you'd implement known API endpoints
        return SolveResult(
            success=False,
            strategy="api",
            error="No public API available for this faucet",
            duration_seconds=time.time() - start,
        )

    async def try_faucet_browser(self, faucet: FaucetConfig) -> SolveResult:
        """Try to solve faucet using browser automation."""
        start = time.time()
        print(f"\n🌐 Trying browser strategy for {faucet.name}...")
        print(f"   URL: {faucet.url}")
        print(f"   Expected: {faucet.expected_amount}")

        await self.init_browser()

        try:
            # Navigate to faucet
            await self.page.goto(faucet.url, wait_until="networkidle")
            await asyncio.sleep(2)  # Let JS load

            # Take initial screenshot
            screenshot = await self.screenshot(f"{faucet.name.replace(' ', '_')}_initial")

            # Detect CAPTCHA
            captcha = await self.detect_captcha()
            print(f"   CAPTCHA detected: {captcha['detected']} ({captcha['type']})")

            if captcha["detected"]:
                # Try to solve based on type
                if captcha["type"] in ["recaptcha", "hcaptcha", "turnstile"]:
                    # These are extremely hard to bypass
                    # Try external service first
                    service_result = await self.solve_with_captcha_service(
                        captcha["type"], faucet.url
                    )
                    if not service_result["success"]:
                        return SolveResult(
                            success=False,
                            strategy="browser",
                            screenshot_path=screenshot,
                            captcha_detected=True,
                            captcha_type=captcha["type"],
                            human_required=True,
                            error=f"{captcha['type']} CAPTCHA detected. {service_result.get('error', '')}",
                            duration_seconds=time.time() - start,
                        )

                elif captcha["type"] == "image":
                    # Image CAPTCHAs can potentially be solved with vision
                    vision_result = await self.solve_with_ai_vision(screenshot)
                    if not vision_result["can_solve"]:
                        return SolveResult(
                            success=False,
                            strategy="browser+vision",
                            screenshot_path=screenshot,
                            captcha_detected=True,
                            captcha_type="image",
                            human_required=True,
                            error="Image CAPTCHA detected but could not be solved automatically.",
                            duration_seconds=time.time() - start,
                        )

            # Try to fill the form if it's a simple form
            if faucet.type == "form":
                result = await self._fill_faucet_form(faucet)
                if result["success"]:
                    return SolveResult(
                        success=True,
                        strategy="browser",
                        amount_received=faucet.expected_amount,
                        duration_seconds=time.time() - start,
                    )

            # Check for success indicators
            content = await self.page.content()
            if faucet.success_indicator and faucet.success_indicator in content:
                return SolveResult(
                    success=True,
                    strategy="browser",
                    amount_received=faucet.expected_amount,
                    duration_seconds=time.time() - start,
                )

            # Final screenshot
            final_screenshot = await self.screenshot(f"{faucet.name.replace(' ', '_')}_final")

            return SolveResult(
                success=False,
                strategy="browser",
                screenshot_path=final_screenshot,
                captcha_detected=captcha["detected"],
                captcha_type=captcha["type"],
                human_required=captcha["detected"],
                error="Could not complete faucet request automatically.",
                duration_seconds=time.time() - start,
            )

        except Exception as e:
            return SolveResult(
                success=False,
                strategy="browser",
                error=str(e),
                duration_seconds=time.time() - start,
            )

    async def _fill_faucet_form(self, faucet: FaucetConfig) -> Dict:
        """Attempt to fill and submit a faucet form."""
        try:
            # Look for address input
            address_selectors = [
                "input[placeholder*='address' i]",
                "input[name*='address' i]",
                "input[id*='address' i]",
                "input[type='text']",
                "textarea[placeholder*='address' i]",
            ]

            address_input = None
            for selector in address_selectors:
                address_input = await self.page.query_selector(selector)
                if address_input:
                    break

            if address_input:
                await address_input.fill(self.target_address)
                print(f"   ✍️  Filled address: {self.target_address}")

            # Look for submit button
            submit_selectors = [
                "button[type='submit']",
                "button:has-text('Request')",
                "button:has-text('Send')",
                "button:has-text('Claim')",
                "input[type='submit']",
                "button:has-text('Get')",
                "button:has-text('Continue')",
            ]

            submit_button = None
            for selector in submit_selectors:
                submit_button = await self.page.query_selector(selector)
                if submit_button:
                    break

            if submit_button:
                # Check if button is disabled (often due to CAPTCHA or wallet connection)
                is_disabled = await submit_button.is_disabled()
                if is_disabled:
                    return {"success": False, "error": "Submit button disabled (likely CAPTCHA or wallet connection required)"}

                await submit_button.click()
                print("   🖱️  Clicked submit")
                await asyncio.sleep(5)
                
                # Verify submission result
                result = await self._verify_submission(faucet)
                return result

            return {"success": False, "error": "No submit button found"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _verify_submission(self, faucet: FaucetConfig) -> Dict:
        """Verify if the form submission was successful."""
        content = await self.page.content()
        url = self.page.url
        
        # Success indicators
        success_keywords = [
            "success", "confirmed", "transaction", "sent", "dripped",
            "check your wallet", "funded", "received", "0x", "hash",
            "you'll receive", "processing", "queued"
        ]
        
        # Error indicators
        error_keywords = [
            "error", "failed", "invalid", "already claimed", "rate limit",
            "too many requests", "please try again", "unable to", "rejected",
            "insufficient", "not available", "disabled", "captcha"
        ]
        
        content_lower = content.lower()
        
        # Check for obvious errors first
        for keyword in error_keywords:
            if keyword in content_lower:
                return {"success": False, "error": f"Submission error detected: '{keyword}'"}
        
        # Check for success
        for keyword in success_keywords:
            if keyword in content_lower:
                return {"success": True, "message": f"Success indicator found: '{keyword}'"}
        
        # If page URL changed, might be success
        if url != faucet.url and url != "about:blank":
            return {"success": True, "message": f"Redirected to: {url}"}
        
        return {"success": False, "error": "No clear success or error indicator found after submission"}

    async def try_twitter_faucet(self, faucet: FaucetConfig) -> SolveResult:
        """Try Twitter-based faucet bots."""
        start = time.time()
        print(f"\n🐦 Trying Twitter strategy for {faucet.name}...")
        return SolveResult(
            success=False,
            strategy="twitter",
            error="Twitter automation not implemented (requires API keys)",
            duration_seconds=time.time() - start,
        )

    async def try_pow_faucet(self, faucet: FaucetConfig) -> SolveResult:
        """Try Proof-of-Work faucet (browser mining)."""
        start = time.time()
        print(f"\n⛏️ Trying PoW strategy for {faucet.name}...")
        return SolveResult(
            success=False,
            strategy="pow",
            error="PoW mining automation not implemented",
            duration_seconds=time.time() - start,
        )

    async def solve_faucet(self, faucet: FaucetConfig) -> SolveResult:
        """Route faucet to appropriate solver strategy."""
        if not faucet.enabled:
            return SolveResult(
                success=False,
                strategy="skip",
                error="Faucet disabled in registry",
            )

        print(f"\n{'='*60}")
        print(f"🎯 Solving: {faucet.name}")
        print(f"{'='*60}")

        if faucet.type == "api":
            return await self.try_faucet_api(faucet)
        elif faucet.type == "twitter":
            return await self.try_twitter_faucet(faucet)
        elif faucet.type == "pow":
            return await self.try_pow_faucet(faucet)
        else:
            return await self.try_faucet_browser(faucet)

    async def run_all(self, networks: List[str] = None) -> List[SolveResult]:
        """Run the agent against all matching faucets."""
        networks = networks or ["base-sepolia", "sepolia"]
        targets = [f for f in self.faucets if f.network in networks]

        print("\n" + "="*60)
        print("🤖 FAUCET SOLVER AGENT")
        print("="*60)
        print(f"Target Address: {self.target_address}")
        print(f"Mode: {'Profile' if self.profile else 'CDP' if self.connect or self.cdp_url else 'Stealth Headless'}")
        print(f"Faucets to try: {len(targets)}")
        print("="*60)

        for faucet in targets:
            result = await self.solve_faucet(faucet)
            self.results.append(result)

        await self.close_browser()
        return self.results

    def print_report(self):
        """Print a summary report of all attempts."""
        print("\n" + "="*60)
        print("📊 FAUCET SOLVER REPORT")
        print("="*60)

        successful = [r for r in self.results if r.success]
        failed = [r for r in self.results if not r.success]
        human_needed = [r for r in self.results if r.human_required]

        print(f"\n✅ Successful: {len(successful)}")
        for r in successful:
            print(f"   + {r.strategy}: {r.amount_received}")

        print(f"\n❌ Failed: {len(failed)}")
        for r in failed:
            faucet_name = "Unknown"
            if r.captcha_detected:
                print(f"   ✗ {r.strategy}: {r.captcha_type} CAPTCHA blocked ({r.error[:50]})")
            else:
                print(f"   ✗ {r.strategy}: {r.error[:50]}")

        print(f"\n👤 Need Human Help: {len(human_needed)}")
        for r in human_needed:
            print(f"   🖼️  Screenshot: {r.screenshot_path}")

        total_eth = sum(
            float(r.amount_received.split()[0])
            for r in successful
            if r.amount_received
        )
        print(f"\n💰 Total Acquired: {total_eth} ETH")
        print("="*60)

        if human_needed:
            print("\n💡 MANUAL FAUCET LINKS:")
            for faucet in self.faucets:
                if faucet.enabled:
                    print(f"   {faucet.name}: {faucet.url}")
            print(f"\n   Address to fund: {self.target_address}")


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Faucet Solver Agent")
    parser.add_argument("--address", default=os.getenv("TARGET_ADDRESS", "0x731b170EB84b20ce6C6568EdAFC1e18fcB5820c6"), help="Target wallet address")
    parser.add_argument("--headed", action="store_true", help="Run browser in headed mode (visible window)")
    parser.add_argument("--profile", default=None, help="Chrome profile name to use (e.g., 'Default', 'Profile 1')")
    parser.add_argument("--connect", action="store_true", help="Connect to existing Chrome via CDP")
    parser.add_argument("--cdp-url", default=None, help="CDP URL to connect to (e.g., http://127.0.0.1:9222)")
    parser.add_argument("--faucet", default=None, help="Specific faucet name to try")
    args = parser.parse_args()

    agent = FaucetSolverAgent(
        target_address=args.address,
        headless=not args.headed,
        profile=args.profile,
        connect=args.connect,
        cdp_url=args.cdp_url,
    )

    if args.faucet:
        # Run specific faucet
        faucet = next((f for f in agent.faucets if args.faucet.lower() in f.name.lower()), None)
        if faucet:
            result = await agent.solve_faucet(faucet)
            agent.results.append(result)
            await agent.close_browser()
        else:
            print(f"Faucet '{args.faucet}' not found")
    else:
        await agent.run_all(networks=["base-sepolia", "sepolia"])

    agent.print_report()


if __name__ == "__main__":
    asyncio.run(main())
