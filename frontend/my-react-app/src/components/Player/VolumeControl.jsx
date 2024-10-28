import { useState, useRef, useEffect } from 'react';
import './VolumeControl.css';

import volumeHighIcon from '../../assets/volumehigh.svg';
import volumeLowIcon from '../../assets/volumelow.svg';
import volumeMuteIcon from '../../assets/volumemute.svg';

function VolumeControl({volume, onVolumeChange}) {
    const [isSliderVisible, setIsSliderVisible] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);
    const volumeRef = useRef(1);

    const volumePercentage = volume * 100;

    const getVolumeIcon = () => {
        if (volume === 0) return volumeMuteIcon;
        if (volumePercentage < 30) return volumeLowIcon;
        return volumeHighIcon;
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleMouseMove(e);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const rect = sliderRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const percentage = Math.round(Math.min(Math.max((x / width), 0), 1) * 100) / 100;
            onVolumeChange(percentage);
            if (percentage > 0) {
                volumeRef.current = percentage;
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const toggleMute = () => {
        if (volume > 0) {
            volumeRef.current = volume;
            onVolumeChange(0);
        } else {
            onVolumeChange(volumeRef.current);
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="volume-control"
            onMouseEnter={() => setIsSliderVisible(true)}
            onMouseLeave={() => setIsSliderVisible(false)}>
            <button className="volume-button" onClick={toggleMute}>
                <img src={getVolumeIcon()} alt="Volume" className="volume-icon" />
            </button>
            <div className={`volume-slider-container ${isSliderVisible ? 'visible' : ''}`}>
                <div className="volume-slider" ref={sliderRef} onMouseDown={handleMouseDown}>
                    <div className="volume-slider-fill" style={{ width: `${volumePercentage }%` }} />
                </div>
            </div>
        </div>
    );
}

export default VolumeControl;