# How to Create the ADOC Deployment Guide PowerPoint

## Quick Start (5-10 minutes)

### Option 1: Use Indium PowerPoint Template (Recommended)

1. **Open your Indium template in PowerPoint**
   - The one shown with the city lights background
   - It should have the orange/blue color scheme

2. **Use the prepared content file**
   - Open: `PPTX_Slide_Content.txt`
   - Copy slide content one by one

3. **Create 15 slides** following this pattern:
   - Slide 1: Title slide (use Indium title template)
   - Slides 2-14: Content slides (use Indium content template)
   - Slide 15: Closing/Thank you slide

4. **Insert the 5 screenshots** at these slides:
   - Slide 5: screenshot_01_login_screen.png
   - Slide 6: screenshot_02_healthy_scenario.png
   - Slide 7: screenshot_05_risky_scenario_cards.png
   - Slide 8: screenshot_04_adoc_platform_alerts.png
   - Slide 9: screenshot_03_no_assets_error.png

5. **Save as:**
   - File name: `ADOC_Extension_Deployment_Guide_Indium.pptx`
   - Format: PowerPoint Presentation (.pptx)

---

## Option 2: Start from Blank PowerPoint

If you don't have the Indium template handy:

### Step 1: Set Up Slide Master

1. Open PowerPoint
2. View → Slide Master
3. Create master slide with:
   - Orange accent bar on left (width: 20px)
   - Indium logo in top right
   - Title area (32-44pt, bold)
   - Content area (18-24pt)
4. Save as template

### Step 2: Apply Indium Colors

**Design → Colors → Create New Color Scheme:**
- Accent 1: #FF6A13 (Indium Orange)
- Accent 2: #0EA5E9 (Blue)
- Background: #FFFFFF (White)
- Text: #1F2937 (Dark Gray)

### Step 3: Add Content

1. Create 15 slides using your template
2. Copy content from `PPTX_Slide_Content.txt`
3. Insert 5 screenshots at designated slides
4. Adjust layout and spacing

---

## Option 3: Convert from HTML (Advanced)

If you have tools that convert HTML to PPTX:

1. Create HTML slides using the structure
2. Use tools like:
   - Pandoc: `pandoc -o output.pptx input.html`
   - Online converters
3. Import to PowerPoint and adjust formatting

---

## Slide-by-Slide Creation Guide

### Slide 1: Title Slide
```
Layout: Indium title slide
Background: City lights image (provided in template)
Title: "ADOC Chrome Extension"
Subtitle: "Deployment Guide for Power BI Integration"
Date: "February 2026"
Footer: "© Indium"
```

### Slide 2: What is ADOC Extension?
```
Layout: Content slide
Title: "ADOC Chrome Extension"
Content: Copy from PPTX_Slide_Content.txt (Slide 2 section)
Elements:
- Heading: "Real-time data quality insights..."
- Bullet list: Key Features (4 items)
- Callout box: Benefit statement
```

### Slide 3: Installation - Step 1
```
Layout: Content slide
Title: "Installation Steps"
Content: Copy from PPTX_Slide_Content.txt (Slide 3 section)
Elements:
- Two sections: Step 1 and Step 2
- Numbered lists
- Code text: chrome://extensions/ (red, italic)
```

### Slide 4: Installation - Step 2
```
Layout: Content slide
Title: "Load Extension"
Content: Copy from PPTX_Slide_Content.txt (Slide 4 section)
Elements:
- Two sections: Step 3 and Step 4
- Checkmark bullets for verification
```

### Slide 5: First Time Login
```
Layout: Content slide with image
Title: "Getting Started"
Content: Copy from PPTX_Slide_Content.txt (Slide 5 section)
Screenshot: screenshot_01_login_screen.png
Placement: Center, 60% width
Elements:
- Two step sections
- Screenshot with caption
```

### Slide 6: Healthy Report
```
Layout: Two-column slide
Title: "Healthy Report Status"
Left: Content from PPTX_Slide_Content.txt
Right: screenshot_02_healthy_scenario.png (50% width)
Elements:
- Checkmark bullets
- Screenshot on right side
```

### Slide 7: Risky Report
```
Layout: Two-column slide
Title: "Risky Report Status"
Left: Content from PPTX_Slide_Content.txt
Right: screenshot_05_risky_scenario_cards.png (50% width)
Elements:
- Warning icon bullets
- Screenshot on right side
```

### Slide 8: ADOC Platform
```
Layout: Content slide with large image
Title: "Deep Dive into Alerts"
Content: Brief text at top
Screenshot: screenshot_04_adoc_platform_alerts.png (full width)
Elements:
- Text section at top
- Full-width screenshot below
```

### Slide 9: No Assets Found
```
Layout: Two-column slide
Title: "No Assets Found"
Left: Content from PPTX_Slide_Content.txt
Right: screenshot_03_no_assets_error.png (50% width)
Elements:
- Stop sign icon bullets
- Screenshot on right side
```

### Slide 10: Key Features
```
Layout: Two-column slide
Title: "Extension Features"
Left column: Refresh & View in ADOC
Right column: Copy & Logout
Elements:
- Icons for each feature
- Brief descriptions
```

### Slide 11: Best Practices
```
Layout: Content slide
Title: "Tips for Success"
Content: Three sections with checkmarks
Elements:
- Before Presentations (4 items)
- Daily Workflow (4 items)
- Communication (4 items)
```

### Slide 12: Troubleshooting
```
Layout: Content slide
Title: "Common Issues & Solutions"
Content: 4 issue/solution pairs
Elements:
- Issue in bold
- Solution with arrows (→)
```

### Slide 13: Support & Contact
```
Layout: Content slide
Title: "Need Help?"
Content: Contact information
Elements:
- Email icons
- Email addresses (make them clickable links)
- Support end date: February 13, 2026
- Additional resources
```

### Slide 14: Summary
```
Layout: Content slide
Title: "Quick Reference"
Content: Status types + Remember section
Elements:
- Emoji indicators (🟢 🟠 🔴)
- Status descriptions with arrows
- Checkmark bullets for Remember section
```

### Slide 15: Thank You
```
Layout: Indium closing slide
Title: "Thank You!"
Content: Questions + Contact info
Elements:
- Contact emails (clickable)
- Support valid date
- Copyright footer
```

---

## Screenshot Insertion Tips

### For Each Screenshot:

1. **Insert Image**
   - Insert → Pictures → This Device
   - Select screenshot file
   - Click Insert

2. **Resize**
   - Drag corners to resize (hold Shift for proportions)
   - Or set specific size in Format tab
   - Recommended: 50-60% of slide width

3. **Position**
   - Align using guides (View → Guides)
   - Center horizontally or align to column
   - Leave margin from slide edges

4. **Add Effects** (optional)
   - Format → Picture Effects → Shadow
   - Use subtle drop shadow
   - Offset: 5px, Blur: 10px

5. **Add Border** (optional)
   - Format → Picture Border
   - Color: Light gray (#E5E7EB)
   - Width: 1pt

---

## Final Touches

### 1. Consistency Check
- [ ] All slides use same fonts
- [ ] Orange accent bar on all content slides
- [ ] Indium logo in same position
- [ ] Consistent spacing and alignment

### 2. Transitions
- [ ] Apply subtle transitions (Fade recommended)
- [ ] Duration: 0.5 seconds
- [ ] Apply to all slides

### 3. Animations (Optional)
- [ ] Keep minimal for professional look
- [ ] Use only for emphasis
- [ ] Avoid distracting effects

### 4. Review
- [ ] Spell check (F7)
- [ ] Verify all links work (Ctrl+Click)
- [ ] Check screenshot quality
- [ ] Verify support dates and emails

### 5. Export Settings
- [ ] Aspect ratio: 16:9 (widescreen)
- [ ] Embed fonts: File → Options → Save → Embed fonts
- [ ] Save as: .pptx format
- [ ] Create PDF version: File → Export → Create PDF

---

## File Naming Convention

Save multiple versions:

1. **Working file:**
   `ADOC_Deployment_Guide_Working.pptx`

2. **Client version:**
   `ADOC_Extension_Deployment_Guide_Indium.pptx`

3. **PDF version:**
   `ADOC_Extension_Deployment_Guide_Indium.pdf`

---

## Delivery Checklist

Before sending to client:

- [ ] All 5 screenshots inserted
- [ ] Support dates updated (Feb 13, 2026)
- [ ] Email addresses correct
- [ ] No spelling/grammar errors
- [ ] File size reasonable (< 10 MB)
- [ ] Test on another computer
- [ ] Create PDF backup
- [ ] Add to zip with extension files

---

## Timeline

**Estimated Time:**
- Template setup: 5 minutes (if using existing Indium template)
- Content entry: 15-20 minutes (copy-paste from .txt file)
- Screenshot insertion: 5 minutes (5 screenshots)
- Formatting & polish: 10 minutes
- Review & export: 5 minutes

**Total: 30-45 minutes**

---

## Need Help?

If you encounter issues:

1. Check that Indium template is available
2. Verify all 5 screenshot files are saved
3. Ensure PowerPoint version supports all features (2016+)
4. Contact support if template is missing

---

## Alternative: Request PPTX Creation

If you prefer, you can:
1. Provide the Indium PowerPoint template file
2. I can create detailed instructions or convert the content
3. Use online services to convert structured content to PPTX

---

**Created:** February 9, 2026
**For:** ADOC Extension Client Deployment
**Support Until:** February 13, 2026
**Contacts:** subhashini.ravichandran@indium.tech, srivathsan.rangaprasad@indium.tech
