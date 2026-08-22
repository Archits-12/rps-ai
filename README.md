# RPS AI — Hand Gesture Mind Reader

**Student:** ARCHIT SINGHANIA  
**USN:** 24BTTSN001

A browser-based Rock–Paper–Scissors case-study project using webcam hand tracking and an adaptive AI opponent.

## Features
- Webcam hand detection with MediaPipe Hands
- Rock, Paper and Scissors recognition
- Adaptive prediction based on previous player moves
- AI counter-move with controlled randomness
- Score, streak, win rate and history
- LocalStorage
- Responsive UI

## Run
Upload the files to GitHub and enable GitHub Pages. Webcam access requires a secure context (HTTPS), so GitHub Pages is ideal.

## GitHub Pages
1. Create a repository named `rps-ai`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md`.
3. Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main`, folder: `/ (root)`.
6. Save and open the generated Pages URL.

## Technologies
HTML5, CSS3, JavaScript, MediaPipe Hands, browser webcam APIs.

## AI
The AI checks transition patterns first: what move you commonly make after your previous move. With insufficient transition data, it uses overall move frequency. It usually plays the counter to the prediction, while adding randomness so it is not perfectly deterministic.
