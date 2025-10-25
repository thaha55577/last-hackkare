import { useState } from 'react';
import RegistrationForm from './RegistrationForm';
import RegistrationForm4 from './RegistrationForm4';

const TeamRegistrationSelector = () => {
  const [mode, setMode] = useState<'five' | 'four'>('five');

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="flex gap-3 mb-6">
          <button
            className={`glow-btn ${mode === 'five' ? 'ring-2 ring-cyan-300' : ''}`}
            onClick={() => setMode('five')}
          >
            Register (5 members)
          </button>
          <button
            className={`glow-btn ${mode === 'four' ? 'ring-2 ring-cyan-300' : ''}`}
            onClick={() => setMode('four')}
          >
            Register (4 members)
          </button>
        </div>

        {mode === 'five' ? <RegistrationForm /> : <RegistrationForm4 />}
      </div>
    </div>
  );
};

export default TeamRegistrationSelector;
