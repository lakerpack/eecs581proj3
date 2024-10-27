import { useState } from 'react'
import playButtonLogo from '../../assets/playbutton.svg'
import stopButtonLogo from '../../assets/stopbutton.svg'
import previousButtonLogo from '../../assets/previousbutton.svg'
import nextButtonLogo from '../../assets/nextbutton.svg'

function Player() {
    const [isPlaying, setIsPlaying] = useState(false);
  
    const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
    };
  
    return (
      <div>
        <div>
          <button>
            <img src={previousButtonLogo}/>
          </button>
  
          <button onClick={togglePlayPause}>
            {isPlaying ? (
              <img src={stopButtonLogo}/>
            ) : (
              <img src={playButtonLogo}/>
            )}
          </button>
  
          <button>
            <img src={nextButtonLogo}/>
          </button>
        </div>
      </div>
    );
  }
  
  export default Player;