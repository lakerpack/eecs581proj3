import './Player.css'
import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'
import defaultImage from '../../assets/default.png'
import { useState } from 'react'

function Player() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="player">
      <div className="player-info">
        <img
          src={defaultImage}
          className="album-cover"
        />
        <div className="song-info">
          <h3 className="song-title">Song</h3>
          <p className="artist-name">Artist name</p>
        </div>
      </div>
      <ProgressBar isPlaying={isPlaying} />
      <PlayerControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    </div>
  );
}

export default Player;