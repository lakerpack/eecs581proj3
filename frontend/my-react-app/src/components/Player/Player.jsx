import './Player.css'
import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'
import VolumeControl from './VolumeControl'

import { useState } from 'react'

import defaultImage from '../../assets/default.png'

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
      <div className='controls-container'>
        <ProgressBar isPlaying={isPlaying} />
        <VolumeControl/>
      </div>
      <PlayerControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    </div>
  );
}

export default Player;