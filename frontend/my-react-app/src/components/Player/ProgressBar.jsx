import { useState, useEffect, useRef } from 'react'
import './ProgressBar.css'

function ProgressBar({currentTime, duration, onTimeUpdate }) {
    const [isDragging, setIsDragging] = useState(false);
    const progressRef = useRef(null);

    const calculateProgress = () => {
        if (!duration) return 0;
        return (currentTime / duration) * 100;
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleMouseMove(e);
    };

    const handleMouseMove = (e) => {
        if (isDragging && progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.min(Math.max((x / rect.width), 0), 1);
            onTimeUpdate(percentage * duration);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
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
        <div className="progress-bar" ref={progressRef} onMouseDown={handleMouseDown}>
            <div className="progress-fill" style={{ width: `${calculateProgress()}%` }} />
            <div className="progress-indicator" style={{ left: `${calculateProgress()}%` }} />
        </div>
    );
}

export default ProgressBar;