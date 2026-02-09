# Design Document

This design document outlines the visual identity and core UI components of this project. The aesthetic leans heavily into a "tech-first," open-source-inspired look, utilizing high-contrast neutrals and vibrant functional colors.

---

## 1. Color Palette

The color system is divided into high-contrast primary tones for branding and UI structure, and secondary colors for accents, alerts, and categorization.

### Primary Colors

These form the foundation of the interface, with **Code Night** and **Open Gray** serving as the primary background and surface layers.

| Name | Hex Code | Usage |
| --- | --- | --- |
| **FOSS Mint** | `#08B74F` | Primary Action, Success State, Branding |
| **Libre White** | `#FFFFFF` | Primary Text, Backgrounds (Light Mode) |
| **Code Night** | `#1A1A1A` | Dark Mode Background, Deep Containers |
| **Open Gray** | `#1E1E1E` | Surface Layers, Borders, Secondary Dark Background |

### Secondary Colors

These should be used sparingly for specific UI feedback or to differentiate between various data sets.

| Name | Hex Code | Usage |
| --- | --- | --- |
| **Pixel Blue** | `#2E90FA` | Links, Information, Selection States |
| **Flame Red** | `#F04438` | Errors, Destructive Actions, Alerts |
| **Byte Yellow** | `#FEC84B` | Warnings, Highlights, Premium Accents |

---

## 2. Typography

The design utilizes **Inter**, a highly legible sans-serif font designed for screens. The hierarchy relies on tight tracking (letter-spacing) and specific line heights to maintain a modern, "engineered" look.

**Font Family:** [Inter](https://fonts.google.com/specimen/Inter)

### Type Hierarchy

| Element | Weight | Tracking | Line Height |
| --- | --- | --- | --- |
| **Heading** | Bold | -6% | 100% |
| **Sub Heading** | Semi-Bold | -6% | 100% |
| **Section Heading** | Medium | -4% | 100% |
| **Body Text** | Regular | -4% | 120% |

> **Note:** The negative tracking (-4% to -6%) is essential for maintaining the "dense" and professional aesthetic. This is particularly important for large display text.

---

## 3. Implementation Notes

* **Accessibility:** Ensure that **FOSS Mint** or **Pixel Blue** text on a **Code Night** background meets WCAG AA contrast standards for readability.
* **Spacing:** Given the tight line heights (100% for headings), ensure sufficient padding between blocks of text to avoid visual clutter.
* **Usage:** **Flame Red** and **Byte Yellow** should be reserved for functional feedback rather than decorative elements to prevent user fatigue.