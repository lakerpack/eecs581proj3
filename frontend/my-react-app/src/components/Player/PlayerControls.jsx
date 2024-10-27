import { useState } from 'react'
import './PlayerControls.css'

import playButtonLogo from '../../assets/playbutton.svg'
import stopButtonLogo from '../../assets/stopbutton.svg'
import previousButtonLogo from '../../assets/previousbutton.svg'
import nextButtonLogo from '../../assets/nextbutton.svg'

function PlayerControls() {
    const [isPlaying, setIsPlaying] = useState(false);
  
    const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
    };
  
    return (
        <div className="player-controls">
          <button className="control-button">
            <img src={previousButtonLogo} className="control-icon"/>
          </button>
          <button className="control-button play-button" onClick={togglePlayPause}>
            {isPlaying ? (
              <img src={stopButtonLogo} className="control-icon" />
            ) : (
              <img src={playButtonLogo} className="control-icon" />
            )}
          </button>
          <button className="control-button">
            <img src={nextButtonLogo} className="control-icon" />
          </button>
        </div>
    );
  }
  
  export default PlayerControls;