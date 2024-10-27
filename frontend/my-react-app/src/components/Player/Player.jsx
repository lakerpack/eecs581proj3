import './Player.css'
import PlayerControls from './PlayerControls'

import defaultImage from '../../assets/default.png'

function Player() {
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
        <PlayerControls/>
      </div>
    );
  }
  
  export default Player;