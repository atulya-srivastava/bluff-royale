# Bluff Royale

![Bluff Royale Logo](./frontend/src/assets/logo.png)

> An online multiplayer implementation of the classic Bluff card game. Outsmart opponents, challenge claims, and eliminate hand cards in real-time card rooms.

🎮 **[Play Directly Here (Live Demo)](https://bluff-royale.onrender.com/)**

---

## Overview

**Bluff Royale** is a web-based multiplayer card game inspired by classic tabletop card room aesthetics. Built with a rich dark mahogany palette and responsive interface components, the platform delivers real-time gameplay for the classic card game **Bluff / Cheat** powered by WebSockets.

---

## Screenshots

| Landing Page Hero |
| :---: |
| <img width="1915" height="942" alt="image" src="https://github.com/user-attachments/assets/2933554a-3823-4619-9f67-1eaf1f551fa0" /> |

| Real-Time Card Table |
| :---: |
| <img width="1915" height="942" alt="image" src="https://github.com/user-attachments/assets/aef04c2d-ce83-4add-9562-1fd0819ef45a" />|

---

## Features

- **Casino Visual Theme**: Dark mahogany wood aesthetic combined with custom card components and consistent UI elements.
- **Real-Time Multiplayer**: Real-time room management, turn handling, move validation, and game state synchronization powered by Socket.IO.
- **In-Game Communication**: Real-time room chat interface with match updates and activity logs.
- **Landing Page Interface**: Dedicated landing page featuring game presentation, visual highlights, and navigation actions.
- **Interactive Rules and Leaderboards**: Built-in modal dialogs for reviewing game mechanics and player rankings.
- **Responsive Layout**: Compatible across mobile, tablet, and desktop viewports.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.IO](https://socket.io/)
- **Typography**: Google Fonts (Poppins, Inter, Nunito)

---

## Directory Structure

```
bluffgame/
├── backend/
│   ├── game/
│   │   └── gameLogic.js       # Card deck management, shuffling, move validation, win logic
│   ├── handlers/
│   │   └── socketHandlers.js  # Socket.IO event listeners, room state, timers
│   ├── server.js              # Express server setup and HTTP initialization
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── logo.png       # Project logo asset
│   │   │   ├── hero_cards.png # Playing cards hero asset
│   │   │   └── wood_bg.png    # Table background texture asset
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   ├── Hero.jsx            # Hero section component
│   │   │   ├── FeatureCard.jsx     # Feature preview card component
│   │   │   ├── Button.jsx          # Styled action button component
│   │   │   ├── RulesModal.jsx      # Game rules modal dialog
│   │   │   ├── LeaderboardModal.jsx# Leaderboard modal dialog
│   │   │   ├── LoginModal.jsx      # Authentication and guest login modal
│   │   │   ├── Lobby.jsx           # Matchmaking and room lobby component
│   │   │   ├── GameBoard.jsx       # Interactive card table component
│   │   │   └── ChatPanel.jsx       # Live chat component
│   │   │
│   │   ├── pages/
│   │   │   └── Landing.jsx         # Main landing page view
│   │   │
│   │   ├── App.jsx                 # Main application container and socket state
│   │   ├── index.css               # Global CSS styling
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/atulya-srivastava/bluff-royale.git
   cd bluffgame
   ```

2. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

### Local Development

1. **Start backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend development server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

---

## Production Build

To build the frontend for production deployment:

```bash
cd frontend
npm run build
```

Production-ready static assets will be output to the `frontend/dist` directory.

---

## Future Roadmap

- Persistent ELO rating system and match history database
- Customizable card back themes and profile customization
- Sound theme selector options
- Spectator mode for live matches

---

## License

This project is licensed under the [MIT License](LICENSE).
