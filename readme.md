# Music Player Web Application

This web application is a music player that allows users to store, play, and manage their music collection. It has a simple UI for play, pause, next, previous, and volume control, built using React and Vite. The backend, built with Flask, handles music storage in an SQLite database and serves metadata and audio files to the frontend.

![UI](./UI.png)

## Features

- **Play and Pause**: Simple control to play and pause songs.
- **Next and Previous**: Navigate through the song list.
- **Volume Control**: Adjust the volume level.
- **Music Queue**: Add or remove songs from the play queue.
- **Cover Art Display**: Shows album art if available.
- **Metadata Retrieval**: Fetches song metadata (artist, album, duration) and displays it on the UI.
- **Backend API**: Provides endpoints for managing the music library and queue.

## Backend Structure

The backend is implemented in Python with Flask, SQLite, and TinyTag for metadata extraction.

#### Key Packages

- **Flask**: Serves as the web framework for building API endpoints.
- **SQLite3**: Used to store music metadata (artists, albums, songs).
- **TinyTag**: Extracts metadata (title, artist, album, duration) from music files.
- **Mutagen**: Handles album art extraction from MP3 files.
- **Flask-CORS**: Enables CORS for communication with the frontend.

#### Database Structure

- **Artists**: Stores artist names.
- **Albums**: Stores album names with foreign keys referencing artists.
- **Songs**: Stores song metadata, including title, album, artist, duration, and file path.
- **Queue**: Manages the play queue for the music player.

#### API Endpoints

- `/api/add_to_queue`: Adds a song to the play queue.
- `/api/remove_from_queue`: Removes a song from the queue based on position.
- `/api/queue`: Retrieves the current play queue.
- `/api/random_song`: Fetches a random song from the database.
- `/api/song/<song_name>`: Retrieves details for a specific song by name.
- `/api/current_song`: Gets the currently playing song.
- `/api/all_songs`: Retrieves all songs in the database.
- `/api/cover_art/<filename>`: Serves album cover art.

### Setting Up the Backend

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python music_database.py
   ```

3. **Database Initialization**:
   The `main()` function initializes the database and adds songs from the default `Music` directory to the library. Run this only once or when reinitializing the database.

## Frontend Structure

The frontend is built using **React** with **Vite** for fast development and **HMR** (Hot Module Replacement).

### Features

- **React Components**: Uses reusable components for the music player controls and song display.
- **ESLint Integration**: Follows coding standards and ensures code quality.
- **Vite Plugins**: Uses `@vitejs/plugin-react` for Babel and Fast Refresh.

### Setting Up the Frontend

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Application**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Contributors
* Anil
* Michelle
* Nathan
* Justin
* Jaret
