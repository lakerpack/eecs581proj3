/*
Artifact(s): App Start
Description: Starts the React App after being run in index.html.
Name: Anil Thapa
Date: 10/26/2024
Revised: N/A
Preconditions: N/A
Postconditions: Starts React
Error and exception conditions: Typos
Side effects: N/A
*/

import './App.css'
import Navbar from './components/Navbar/Navbar'
import Player from './components/Player/Player'
import QueueManager from './components/QueueManager/QueueManager'
import { QueueProvider } from './context/QueueContext'
import { AuthProvider } from './components/Auth/Auth'

function App() {
    return (
        <AuthProvider>
            <QueueProvider>
                <div>
                    <Navbar />
                    <div className="main-container">
                        <div className="queue-section">
                            <QueueManager />
                        </div>
                        <div className="player-section">
                            <Player />
                        </div>
                    </div>
                </div>
            </QueueProvider>
        </AuthProvider>
    );
}
export default App
