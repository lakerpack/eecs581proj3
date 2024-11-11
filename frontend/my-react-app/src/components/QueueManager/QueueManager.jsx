/*
Artifact(s): Queue system
Description: React context to share states between the QueueManager and Player
Name: Anil Thapa
Date: 11/07/2024
Revised: 11/09/2024 (Bugfixing -- Anil)
Preconditions: Information about the queue from QueueContext
Postconditions: Alters the state of the queue
Error and exception conditions: Rapid changes in positions that can cause race conditions and resource errors
Side effects: N/A
*/

import { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../../context/QueueContext';
import './QueueManager.css';

import uploadButtonLogo from '../../assets/uploadbutton.svg'
import defaultImage from '../../assets/default.png';

/*
Meant to handle the queue management and keep Player separate and complete enough. As a result of Player splitting,
we use a QueueContext to handle states between the two components. QueueManager manages the library display and the 
queue visualization (also has the Player component wrapped inside for styling). 
*/

function QueueManager({ children }) {
    const {
        queue,
        currentQueuePosition,
        fetchQueue,
        addToQueue,
        removeFromQueue
    } = useQueue();

    const [availableSongs, setAvailableSongs] = useState([]);

    /*
    Filter out any songs that have been moved past in the queue.
    */
    const filteredQueue = useMemo(() => {
        return queue.filter(song => song.position >= currentQueuePosition);
    }, [queue, currentQueuePosition]);

    /*
    Store the complete library of available songs so we can provide the user an option to add 
    a song of their choosing provided it's in the backend library. 
    */
    useEffect(() => {
        const fetchAvailableSongs = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/all_songs');
                const data = await response.json();
                setAvailableSongs(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAvailableSongs();
    }, []);


    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/upload_file', { method: 'POST', body: formData });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const updatedLibrary = await fetch('http://127.0.0.1:5000/api/all_songs');
            const data = await updatedLibrary.json();
            setAvailableSongs(data);
        } catch (err) {
            console.error(err);
        }
    };

    /*
    Whenever we move forward in the queue, we update the queue on our end. 
    */
    useEffect(() => {
        const updateQueue = async () => {
            await fetchQueue();
        };
        updateQueue();
    }, [currentQueuePosition]);

    /*
    Add songs to the shared queue and interface with the context when adding a song. 
    This is meant to update the queue for both the Player and the QueueManager.
    */
    const handleAddToQueue = async (songTitle) => {
        try {
            // const currentPosition = currentQueuePosition; 
            await addToQueue(songTitle);
            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };

    /*
    Get the initial queue state
    */
    useEffect(() => {
        fetchQueue();
    }, []);

    /*
    Remove songs from the shared queue
    */
    const handleRemoveFromQueue = async (position) => {
        try {
            await removeFromQueue(position);
            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div className="queue-manager">
            <div className="library-section">
                <div className="library-header">
                    <h2>Library</h2>
                    <div>
                        <input type="file" id="file-upload" className="upload-input" onChange={handleFileUpload} accept="audio/*"/>
                        <label htmlFor="file-upload" className="upload-button"><img src={uploadButtonLogo} className="upload-icon"/></label>
                    </div>
                </div>
                <div className="available-songs">
                    {availableSongs.map((song) => (
                        <div key={`library-${song.id}-${song.title}`} className="song-item">
                            <div className="song-info">
                                <img src={song.cover_art ? `http://127.0.0.1:5000/api/cover_art/${song.cover_art.split('/').pop()}` : defaultImage} alt={song.title} className="song-cover" />
                                <div className="song-details">
                                    <h3>{song.title}</h3>
                                    <p>{song.artist}</p>
                                </div>
                            </div>
                            <button className="add-button" onClick={() => handleAddToQueue(song.title)}>+</button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="queue-section">
                <h2>Queue {/*({filteredQueue.length} remaining)*/}</h2>
                <div className="queue-list">
                    {filteredQueue.map((song) => (
                        <div key={`queue-${song.position}-${song.title}`} className={`queue-item ${song.position === currentQueuePosition ? 'current-song' : ''}`}>
                            <div className="song-info">
                                <span className="position">{song.position}</span>
                                <div className="song-details">
                                    <h3>{song.title}</h3>
                                </div>
                            </div>
                            {/*<button className="remove-button" onClick={() => handleRemoveFromQueue(song.position)}>×</button>*/}
                        </div>
                    ))}
                </div>
            </div>
            {children}
        </div>
    );
}

export default QueueManager;