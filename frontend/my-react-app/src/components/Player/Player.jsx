import './Player.css'
import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'
import VolumeControl from './VolumeControl'

import { useState, useRef, useEffect } from 'react'

import defaultImage from '../../assets/default.png'

function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef(new Audio());
  const intervalRef = useRef();

  let apiUrl = 'http://127.0.0.1:5000/api/random_song';

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch song data');
        }
        const data = await response.json();
        // console.log(data)
        setSongData(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSong();
  }, []);


  useEffect(() => {
    const audio = audioRef.current;
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setTimeUpdate);
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setTimeUpdate);
    };
  }, []);

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
        <VolumeControl />
      </div>
      <PlayerControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    </div>
  );
}

export default Player;