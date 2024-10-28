/*
Artifact(s): Play Button, Stop Button, Next Button
Description: React component that provides the play, stop, and next button. Modifies the value of isPlaying and can set the state of the music player. 
Name: Anil Thapa, Michelle Chen
Date: 10/26/2024
Revised: 10/27/2024 (Integrating with Backend -- Anil)
Preconditions: N/A
Postconditions: Provides an interface for music
Error and exception conditions: Mistakes in the backend
Side effects: N/A
*/

import './PlayerControls.css'

import playButtonLogo from '../../assets/playbutton.svg'
import stopButtonLogo from '../../assets/stopbutton.svg'
import previousButtonLogo from '../../assets/previousbutton.svg'
import nextButtonLogo from '../../assets/nextbutton.svg'

function PlayerControls({ isPlaying, setIsPlaying, onPrevious, onNext }) {
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="player-controls">
      <button className="control-button" onClick={onPrevious}>
        <img src={previousButtonLogo} className="control-icon" />
      </button>
      <button className="control-button play-button" onClick={togglePlayPause}>
        {isPlaying ? (
          <img src={stopButtonLogo} className="control-icon" />
        ) : (
          <img src={playButtonLogo} className="control-icon" />
        )}
      </button>
      <button className="control-button" onClick={onNext}>
        <img src={nextButtonLogo} className="control-icon" />
      </button>
    </div>
  );
}

export default PlayerControls;