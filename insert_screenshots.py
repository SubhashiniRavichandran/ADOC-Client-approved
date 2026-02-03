#!/usr/bin/env python3
"""
ADOC Extension Documentation - Screenshot Insertion Script

This script automatically inserts the 5 provided screenshots into the HTML documentation files.
It replaces placeholder divs with actual image tags (using file references).

Usage:
    python3 insert_screenshots.py

Prerequisites:
    - Screenshots saved in screenshots/ folder with correct names
    - USER_GUIDE_FORMATTED.html exists
    - DEPLOYMENT_GUIDE_FORMATTED.html exists
"""

import os
import re
import base64
from pathlib import Path

# Configuration
SCREENSHOTS_DIR = "screenshots"
USER_GUIDE_FILE = "USER_GUIDE_FORMATTED.html"
DEPLOYMENT_GUIDE_FILE = "DEPLOYMENT_GUIDE_FORMATTED.html"

# Screenshot mapping: placeholder text → image file
SCREENSHOT_MAPPING = {
    # User Guide
    "Login screen with ADOC logo, chart icon, and \"Login to Acceldata\" button": "screenshot_01_login_screen.png",
    "Full extension popup showing Healthy scenario": "screenshot_02_healthy_scenario.png",
    "Error view showing": "screenshot_03_no_assets_error.png",
    "ADOC platform showing alerts page": "screenshot_04_adoc_platform_alerts.png",
    "Full extension popup showing Risky scenario": "screenshot_05_risky_scenario_cards.png",

    # Alternative matches (shorter versions)
    "Login screen": "screenshot_01_login_screen.png",
    "Healthy": "screenshot_02_healthy_scenario.png",
    "Error": "screenshot_03_no_assets_error.png",
    "alerts page": "screenshot_04_adoc_platform_alerts.png",
    "Risky": "screenshot_05_risky_scenario_cards.png",
}


def check_screenshots_exist():
    """Check if all required screenshot files exist."""
    screenshots_path = Path(SCREENSHOTS_DIR)
    if not screenshots_path.exists():
        print(f"❌ Error: {SCREENSHOTS_DIR}/ folder not found")
        print(f"   Please create it and add your screenshots")
        return False

    required_files = [
        "screenshot_01_login_screen.png",
        "screenshot_02_healthy_scenario.png",
        "screenshot_03_no_assets_error.png",
        "screenshot_04_adoc_platform_alerts.png",
        "screenshot_05_risky_scenario_cards.png",
    ]

    missing_files = []
    for filename in required_files:
        filepath = screenshots_path / filename
        if not filepath.exists():
            missing_files.append(filename)

    if missing_files:
        print(f"❌ Error: Missing {len(missing_files)} screenshot(s):")
        for filename in missing_files:
            print(f"   - {filename}")
        print(f"\n   Please add them to {SCREENSHOTS_DIR}/ folder")
        return False

    print(f"✅ All 5 screenshots found in {SCREENSHOTS_DIR}/")
    return True


def image_to_base64(image_path):
    """Convert image file to base64 string."""
    with open(image_path, 'rb') as f:
        image_data = f.read()
    return base64.b64encode(image_data).decode('utf-8')


def replace_placeholder_with_image(html_content, use_base64=False):
    """Replace screenshot placeholders with actual image tags."""

    # Pattern to match screenshot divs
    pattern = r'<div class="screenshot">\s*<strong>\[INSERT SCREENSHOT\]</strong><br>\s*(.*?)\s*</div>'

    def replacement(match):
        description = match.group(1)

        # Find matching screenshot
        image_file = None
        for key, value in SCREENSHOT_MAPPING.items():
            if key.lower() in description.lower():
                image_file = value
                break

        if not image_file:
            # No match found, keep placeholder
            return match.group(0)

        image_path = Path(SCREENSHOTS_DIR) / image_file

        if not image_path.exists():
            # Image file doesn't exist, keep placeholder
            return match.group(0)

        # Create image tag
        if use_base64:
            # Embed image as base64
            base64_data = image_to_base64(image_path)
            img_tag = f'<img src="data:image/png;base64,{base64_data}" alt="{description}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; margin: 10px 0;">'
        else:
            # Reference external file
            img_tag = f'<img src="{SCREENSHOTS_DIR}/{image_file}" alt="{description}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; margin: 10px 0;">'

        # Return new div with image
        return f'<div class="screenshot" style="background: white; border: none; padding: 20px; text-align: center;">\n{img_tag}\n<p style="color: #6b7280; font-size: 10pt; margin-top: 10px; font-style: italic;">{description}</p>\n</div>'

    # Replace all matches
    updated_content = re.sub(pattern, replacement, html_content, flags=re.DOTALL)

    return updated_content


def count_placeholders(html_content):
    """Count remaining placeholders."""
    pattern = r'<div class="screenshot">\s*<strong>\[INSERT SCREENSHOT\]</strong>'
    matches = re.findall(pattern, html_content)
    return len(matches)


def process_file(input_file, output_file, use_base64=False):
    """Process a single HTML file."""
    print(f"\n📄 Processing: {input_file}")

    # Read file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print(f"   ❌ Error: File not found: {input_file}")
        return False

    # Count original placeholders
    original_count = count_placeholders(html_content)
    print(f"   📊 Found {original_count} placeholders")

    # Replace placeholders
    updated_content = replace_placeholder_with_image(html_content, use_base64)

    # Count remaining placeholders
    remaining_count = count_placeholders(updated_content)
    replaced_count = original_count - remaining_count

    print(f"   ✅ Replaced {replaced_count} placeholders")
    print(f"   ℹ️  {remaining_count} placeholders remaining (need additional screenshots)")

    # Write output file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"   💾 Saved to: {output_file}")
        return True
    except Exception as e:
        print(f"   ❌ Error writing file: {e}")
        return False


def main():
    """Main function."""
    print("=" * 70)
    print("ADOC Extension Documentation - Screenshot Insertion")
    print("=" * 70)

    # Check if screenshots exist
    if not check_screenshots_exist():
        print("\n❌ Cannot proceed without screenshots")
        print("\nPlease add the 5 screenshots to the screenshots/ folder:")
        print("  1. screenshot_01_login_screen.png")
        print("  2. screenshot_02_healthy_scenario.png")
        print("  3. screenshot_03_no_assets_error.png")
        print("  4. screenshot_04_adoc_platform_alerts.png")
        print("  5. screenshot_05_risky_scenario_cards.png")
        return

    # Ask user for embedding method
    print("\n📋 Choose embedding method:")
    print("  1. File reference (recommended) - smaller file, requires screenshots folder")
    print("  2. Base64 embed - standalone file, larger size")
    choice = input("\nEnter choice (1 or 2) [1]: ").strip() or "1"

    use_base64 = choice == "2"

    if use_base64:
        print("\n✓ Using base64 embedding (standalone HTML)")
    else:
        print("\n✓ Using file references (requires screenshots/ folder)")

    # Process files
    success = True

    # User Guide
    if os.path.exists(USER_GUIDE_FILE):
        output_file = USER_GUIDE_FILE.replace('.html', '_with_screenshots.html')
        if not process_file(USER_GUIDE_FILE, output_file, use_base64):
            success = False
    else:
        print(f"\n⚠️  Warning: {USER_GUIDE_FILE} not found, skipping")

    # Deployment Guide
    if os.path.exists(DEPLOYMENT_GUIDE_FILE):
        output_file = DEPLOYMENT_GUIDE_FILE.replace('.html', '_with_screenshots.html')
        if not process_file(DEPLOYMENT_GUIDE_FILE, output_file, use_base64):
            success = False
    else:
        print(f"\n⚠️  Warning: {DEPLOYMENT_GUIDE_FILE} not found, skipping")

    # Summary
    print("\n" + "=" * 70)
    if success:
        print("✅ Screenshot insertion complete!")
        print("\nNext steps:")
        print("  1. Open *_with_screenshots.html files in browser to preview")
        print("  2. Open in Microsoft Word: Right-click → Open with → Word")
        print("  3. Save as DOCX: File → Save As → Word Document")
        print("  4. Share with client!")
    else:
        print("⚠️  Screenshot insertion completed with some errors")
        print("   Check the messages above for details")
    print("=" * 70)


if __name__ == "__main__":
    main()
