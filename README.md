# Infinite Vertical 3D Image Slider

A smooth, infinite vertical image slider built with Three.js. Scroll, drag, or swipe through a looping stack of 3D planes with velocity-based distortion and momentum.

**Author:** [anassjid](https://github.com/ajxdevx)

## Features

- Infinite vertical loop with variable slide heights
- Wheel, drag, and touch input with momentum
- Real-time vertex distortion tied to scroll velocity
- Active slide title and counter overlay
- Hidden scrollbars for a clean full-screen experience

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173`.

### Build

```bash
npm run build
```

Output is written to the `dist/` folder.

### Preview production build

```bash
npm run preview
```

## Project Structure

```
├── index.html      # App shell
├── script.js       # Three.js scene, slider logic, input handling
├── styles.css      # Layout and typography
├── public/         # Slide images (img1.jpg – img10.jpg)
└── vite.config.js  # Vite configuration
```

## Customization

Edit the `slides` array in `script.js` to change image paths and titles. Adjust behavior in the `config` object (scroll speed, distortion strength, momentum, and more).

## Tech Stack

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)

## License

ISC
