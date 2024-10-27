import { useState, useEffect, useRef } from 'react'
import './ProgressBar.css'

function ProgressBar({ isPlaying }) {
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const progressRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (isPlaying && !isDragging) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(animationRef.current);
        }
        return () => cancelAnimationFrame(animationRef.current);
    }, [isPlaying, isDragging]);

    const animate = () => {
        if (progress < 100) {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + 0.025;
            });
            animationRef.current = requestAnimationFrame(animate);
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleMouseMove(e);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const rect = progressRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const percentage = Math.min(Math.max((x / width) * 100, 0), 100);
            setProgress(percentage);
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
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <div className="progress-indicator" style={{ left: `${progress}%` }} />
        </div>
    );
}

export default ProgressBar;