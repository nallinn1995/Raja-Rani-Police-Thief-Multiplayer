import React, { useState } from 'react';
import { Crown, Users, Play } from 'lucide-react';

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Raja Rani</h1>
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">Police Thief</h2>
          <p className="text-gray-600">A thrilling multiplayer card game for 4 players</p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={onCreateRoom}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
          >
            <Users className="w-5 h-5" />
            <span>Create Room</span>
          </button>
          
          <button
            onClick={onJoinRoom}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
          >
            <Play className="w-5 h-5" />
            <span>Join Room</span>
          </button>
        </div>

        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full text-purple-600 hover:text-purple-700 font-medium py-2 transition-colors duration-200"
        >
          {showRules ? 'Hide Rules' : 'Show Rules'}
        </button>

        {showRules && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 space-y-2 animate-fadeIn">
            <h3 className="font-semibold text-gray-800 mb-2">How to Play:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>4 players get random roles: Raja, Rani, Police, Thief</li>
              <li>Police must identify and find the Thief</li>
              <li>Police gets ONE guess</li>
              <li><strong>Scoring:</strong></li>
              <li className="ml-4">Correct guess: Police +3, Raja +2, Rani +1</li>
              <li className="ml-4">Wrong guess: Thief +3, others +1</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};