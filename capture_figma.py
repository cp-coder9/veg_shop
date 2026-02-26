"""
Playwright script to capture Figma prototype screenshots.
Captures design system elements from the Never.Regular.Studio Figma prototype.
"""

from playwright.sync_api import sync_playwright
import time
import os

# Figma prototype URL
FIGMA_URL = "https://www.figma.com/proto/pBwjKNPXBOoK01QR11Zmwg/Never.Regular.Studio?page-id=462%3A2&node-id=464-288&p=f&viewport=963%2C44%2C0.41&t=RfHCAfvZdXQYMuIw-1&scaling=scale-down&content-scaling=fixed"

# Output directory
OUTPUT_DIR = "design-captures"

def capture_figma_screenshots():
    """Capture screenshots from Figma prototype."""
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=2  # High DPI for better quality
        )
        page = context.new_page()
        
        print(f"Navigating to Figma prototype...")
        # Use domcontentloaded instead of load - Figma is a heavy SPA
        page.goto(FIGMA_URL, timeout=120000, wait_until='domcontentloaded')
        
        # Wait for Figma to fully load - it's a heavy SPA
        print("Waiting for Figma to load...")
        time.sleep(15)  # Initial wait for Figma loader
        
        # Wait for network to be idle
        try:
            page.wait_for_load_state('networkidle', timeout=60000)
        except Exception as e:
            print(f"Network idle timeout (expected for Figma): {e}")
        
        # Additional wait for canvas to render
        time.sleep(5)
        
        # Get page title
        title = page.title()
        print(f"Page title: {title}")
        
        # Capture 1: Initial landing page view (Screen 4/9 based on previous run)
        print("Capturing initial screen...")
        page.screenshot(path=f"{OUTPUT_DIR}/01_initial_screen.png", full_page=False)
        time.sleep(2)
        
        # Navigate to the beginning of the prototype (screen 1)
        # Press left arrow multiple times to get to the first screen
        print("Navigating to first screen...")
        for i in range(10):  # Press left several times to ensure we're at the start
            page.keyboard.press('ArrowLeft')
            time.sleep(0.5)
        
        time.sleep(3)
        
        # Capture all 9 screens
        print("Capturing all prototype screens...")
        for screen_num in range(1, 10):  # Screens 1-9
            print(f"Capturing screen {screen_num}...")
            page.screenshot(path=f"{OUTPUT_DIR}/screen_{screen_num:02d}.png", full_page=False)
            
            # Navigate to next screen
            if screen_num < 9:
                page.keyboard.press('ArrowRight')
                time.sleep(2)
        
        # Capture additional views with different interactions
        
        # Try clicking on the prototype area to see if there are hotspots
        print("Looking for interactive hotspots...")
        page.mouse.click(960, 540)  # Center of viewport
        time.sleep(2)
        page.screenshot(path=f"{OUTPUT_DIR}/interactive_click_test.png", full_page=False)
        
        # Try to capture any design system elements by looking for specific UI patterns
        # Press Escape to see if there are any overlays or menus
        page.keyboard.press('Escape')
        time.sleep(1)
        page.screenshot(path=f"{OUTPUT_DIR}/after_escape_key.png", full_page=False)
        
        # Try zooming out to see the full canvas
        print("Trying to zoom out for full canvas view...")
        for _ in range(5):
            page.keyboard.down('Control')
            page.keyboard.press('Minus')
            page.keyboard.up('Control')
            time.sleep(0.5)
        page.screenshot(path=f"{OUTPUT_DIR}/zoomed_out_view.png", full_page=False)
        
        # Reset zoom
        page.keyboard.down('Control')
        page.keyboard.press('Digit0')
        page.keyboard.up('Control')
        time.sleep(1)
        
        # Capture viewport dimensions for reference
        viewport = page.viewport_size
        print(f"Viewport size: {viewport}")
        
        # Try to get any visible text content for analysis
        try:
            body_text = page.locator('body').inner_text()
            print(f"\n--- Page Text Content ---")
            print(body_text[:2000])
            print("--- End of Text Content ---\n")
        except Exception as e:
            print(f"Could not extract text: {e}")
        
        browser.close()
        print(f"\nScreenshots saved to {OUTPUT_DIR}/")
        print(f"Total screens captured: 9 prototype screens + additional interaction tests")

if __name__ == "__main__":
    capture_figma_screenshots()
