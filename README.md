# Copilot Cowork Estimator

A lightweight GitHub Pages application that helps partners estimate:

- Monthly Copilot Cowork consumption
- Monthly credit usage
- Light, medium, and heavy prompting by user segment
- Annual budget requirements
- Cost per user
- Scenario presets
- Budget guardrails
- Optional value framing
- Shareable scenario links
- Copy, download, and print/save summary actions

Default assumptions are based on Microsoft Frontier customer usage as of 5/27/2026 and assume Anthropic Opus 4.8.

The app includes model guidance for task weight:

- Light tasks: Sonnet 4.6
- Medium tasks: Sonnet 4.6 as the sweet spot
- Heavy tasks: Opus 4.8

## Files

- `index.html` - partner-facing estimator page
- `styles.css` - app styling
- `estimator.js` - calculator logic
- `CustomerCoworkEstimator.xlsx` - downloadable workbook
- `.nojekyll` - keeps GitHub Pages publishing simple

## Local use

Open `index.html` in a browser, adjust the assumptions, and use **Calculate**.

## GitHub Pages

Publish from the `main` branch root. The public app URL will be:

`https://bosh345.github.io/customer-cowork-estimator-app/`

## Disclaimer

This tool provides illustrative estimates only and should not be treated as contractual pricing.
