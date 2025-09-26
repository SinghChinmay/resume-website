# Resume Website

A kawaii-themed personal resume website featuring interactive elements and responsive design.

## 🚀 Live Demo

This website is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

**Website URL:** `https://singhchinmay.github.io/resume-website/`

## 📦 GitHub Pages Deployment

This repository is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages** in your repository settings:
   - Go to Repository Settings > Pages
   - Set Source to "GitHub Actions"
   - The workflow will automatically deploy on push to `main`

2. **Manual Deployment:**
   - Navigate to Actions tab in your repository
   - Find "Deploy to GitHub Pages" workflow
   - Click "Run workflow" to deploy manually

### Deployment Workflow

The `.github/workflows/pages.yml` file contains the deployment configuration:
- Triggers on push to `main` branch
- Uploads static files (HTML, CSS, JS) to GitHub Pages
- Deploys automatically with proper permissions

## 🎨 Features

- **Kawaii Theme:** Cat-themed design with interactive elements
- **Dark/Light Mode:** Toggle between themes
- **Interactive Eyes:** Cat eyes that follow cursor movement
- **Responsive Design:** Works on desktop and mobile devices
- **Animated Elements:** Floating paws and sparkle effects

## 🛠️ Local Development

To run locally:

```bash
# Clone the repository
git clone https://github.com/SinghChinmay/resume-website.git
cd resume-website

# Start a local server
python3 -m http.server 8000
# or
npx serve .

# Open http://localhost:8000 in your browser
```

## 📁 File Structure

```
├── index.html          # Main HTML file
├── style.css           # Styling and animations
├── script.js           # JavaScript functionality
├── .github/
│   └── workflows/
│       └── pages.yml   # GitHub Pages deployment workflow
└── README.md           # Documentation
```

## 🔧 Customization

- Edit `index.html` to update resume content
- Modify `style.css` for visual customization
- Update `script.js` for interactive features

Changes pushed to `main` branch will automatically deploy to GitHub Pages.