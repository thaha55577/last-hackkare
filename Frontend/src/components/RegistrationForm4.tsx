import { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase.ts';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.ts';
import { useNavigate } from 'react-router-dom';

interface Member {
  name: string;
  regNo: string;
  year: string;
  dept: string;
  phone: string;
  residenceType?: 'Day Scholar' | 'Hosteller';
  hostelName?: string;
  roomNumber?: string;
  wardenName?: string;
  wardenPhone?: string;
}

const RegistrationForm4 = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  const [leader, setLeader] = useState<Member>({
    name: '',
    regNo: '',
    year: '',
    dept: '',
    phone: '',
    residenceType: 'Day Scholar',
    hostelName: '',
    roomNumber: '',
    wardenName: '',
    wardenPhone: '',
  });

  const [member1, setMember1] = useState<Member>({
    name: '',
    regNo: '',
    year: '',
    dept: '',
    phone: '',
    residenceType: 'Day Scholar',
    hostelName: '',
    roomNumber: '',
    wardenName: '',
    wardenPhone: '',
  });

  const [member2, setMember2] = useState<Member>({
    name: '',
    regNo: '',
    year: '',
    dept: '',
    phone: '',
    residenceType: 'Day Scholar',
    hostelName: '',
    roomNumber: '',
    wardenName: '',
    wardenPhone: '',
  });

  const [member3, setMember3] = useState<Member>({
    name: '',
    regNo: '',
    year: '',
    dept: '',
    phone: '',
    residenceType: 'Day Scholar',
    hostelName: '',
    roomNumber: '',
    wardenName: '',
    wardenPhone: '',
  });

  const handleMemberChange = (
    memberSetter: React.Dispatch<React.SetStateAction<Member>>,
    field: keyof Member,
    value: string
  ) => {
    if (field === 'name') {
      const capitalized = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      memberSetter(prev => ({ ...prev, [field]: capitalized }));
    } else if (field === 'dept') {
      memberSetter(prev => ({ ...prev, [field]: value.toUpperCase() }));
    } else if (field === 'phone' || field === 'wardenPhone') {
      // Only allow numeric input for phone numbers
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length <= 10) {
        memberSetter(prev => ({ ...prev, [field]: numericValue }));
      }
    } else if (field === 'regNo' || field === 'roomNumber') {
      // Only allow numeric input for registration number and room number
      const numericValue = value.replace(/[^0-9]/g, '');
      memberSetter(prev => ({ ...prev, [field]: numericValue }));
    } else if (field === 'year') {
      // Only allow numeric input for year
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length <= 1) {
        memberSetter(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      memberSetter(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const postWithRetry = async (url: string, body: any, idToken?: string) => {
    const maxAttempts = 5;
    const baseDelay = 400; // ms

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify(body),
        });

        if (res.ok || (res.status >= 400 && res.status < 500)) {
          return res;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
      } catch (err) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return new Response(null, { status: 503, statusText: 'Service Unavailable' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    const members = [leader, member1, member2, member3];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.name || !member.regNo || !member.year || !member.dept || !member.phone) {
        toast.error(`Please fill all fields for ${i === 0 ? 'Team Leader' : `Member ${i}`}`);
        return;
      }
      if (member.phone.length !== 10) {
        toast.error(`Please enter a valid 10-digit phone number for ${i === 0 ? 'Team Leader' : `Member ${i}`}`);
        return;
      }
    }

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (m.residenceType === 'Hosteller') {
        if (!m.hostelName || !m.roomNumber || !m.wardenName || !m.wardenPhone) {
          toast.error(`Please fill all hostel fields for ${i === 0 ? 'Team Leader' : `Member ${i}`}`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      // cooldown check
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const lastRef = ref(db, `userLastRegistration/${uid}`);
          const lastSnap = await get(lastRef);
          if (lastSnap.exists()) {
            const lastVal = lastSnap.val();
            const lastTs = typeof lastVal === 'number' ? lastVal : lastVal.lastRegisteredAt || 0;
            const elapsed = Date.now() - lastTs;
            const cooldown = 5 * 60 * 1000;
            if (elapsed < cooldown) {
              const remaining = cooldown - elapsed;
              const mins = Math.floor(remaining / 60000);
              const secs = Math.ceil((remaining % 60000) / 1000);
              toast.info(`Registration already completed. Try again in ${mins}m ${secs}s`);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Could not read last registration timestamp', err);
        }
      }

      const payload: any = {
        teamName: teamName.trim(),
        members,
        createdAt: new Date().toISOString(),
      };

      const env = (import.meta as any).env || {};
      const endpoint = env.VITE_REGISTER_ENDPOINT || `${env.BASE_URL ?? '/'}api/registerTeam`;
      const useDirect = !env.VITE_REGISTER_ENDPOINT;
      const token = await auth.currentUser?.getIdToken();

      let didSave = false;

      if (useDirect) {
        try {
          await set(ref(db, 'teams/' + teamName.trim()), { members, createdAt: Date.now() });
          didSave = true;
        } catch (err) {
          console.error('Direct DB write failed', err);
          toast.error('Registration failed: could not save to database');
        }
      } else {
        const res = await postWithRetry(endpoint, payload, token);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (res.status === 503) {
            try {
              await set(ref(db, 'teams/' + teamName.trim()), { members, createdAt: Date.now() });
              didSave = true;
            } catch (err) {
              console.error('Fallback DB write failed', err);
              toast.error('Registration failed: ' + (text || res.statusText));
            }
          } else {
            toast.error('Registration failed: ' + (text || res.statusText));
          }
        } else {
          didSave = true;
        }
      }

      if (didSave) {
        toast.success('Team Registered Successfully!');
        try {
          const uid2 = auth.currentUser?.uid;
          if (uid2) {
            const lastRef2 = ref(db, `userLastRegistration/${uid2}`);
            await set(lastRef2, { lastRegisteredAt: Date.now() });
          }
        } catch (err) {
          console.warn('Could not write last registration timestamp', err);
        }

        setTeamName('');
  const emptyMember: Member = {
    name: '',
    regNo: '',
    year: '',
    dept: '',
    phone: '',
    residenceType: 'Day Scholar',
    hostelName: '',
    roomNumber: '',
    wardenName: '',
    wardenPhone: ''
  };        setLeader(emptyMember);
        setMember1(emptyMember);
        setMember2(emptyMember);
        setMember3(emptyMember);
      }
    } catch (error: any) {
      console.error('Registration error', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMemberFields = (
    member: Member,
    setter: React.Dispatch<React.SetStateAction<Member>>,
    label: string
  ) => (
    <div className="mb-6 p-4 border border-cyan-500/30 rounded-lg">
      <h3 className="text-cyan-300 font-semibold mb-3" style={{ fontFamily: 'Orbitron' }}>
        {label}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Name"
          className="glow-input"
          value={member.name}
          onChange={(e) => handleMemberChange(setter, 'name', e.target.value)}
          required
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Register Number"
          className="glow-input"
          value={member.regNo}
          onChange={(e) => handleMemberChange(setter, 'regNo', e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Year"
          className="glow-input"
          value={member.year}
          onChange={(e) => handleMemberChange(setter, 'year', e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="DEPARTMENT"
          className="glow-input"
          value={member.dept.toUpperCase()}
          onChange={(e) => handleMemberChange(setter, 'dept', e.target.value.toUpperCase())}
          required
          style={{ textTransform: 'uppercase' }}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="glow-input"
          value={member.phone}
          onChange={(e) => handleMemberChange(setter, 'phone', e.target.value)}
          required
          pattern="[0-9]{10}"
          maxLength={10}
        />
        <select
          className="glow-input"
          value={member.residenceType}
          onChange={(e) => handleMemberChange(setter, 'residenceType', e.target.value)}
        >
          <option value="Day Scholar">Day Scholar</option>
          <option value="Hosteller">Hosteller</option>
        </select>
      </div>

      {member.residenceType === 'Hosteller' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 p-4 border border-cyan-500/30 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Hostel Name"
              className="glow-input"
              value={member.hostelName}
              onChange={(e) => handleMemberChange(setter, 'hostelName', e.target.value)}
              required={member.residenceType === 'Hosteller'}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Room Number"
              className="glow-input"
              value={member.roomNumber}
              onChange={(e) => handleMemberChange(setter, 'roomNumber', e.target.value)}
              required={member.residenceType === 'Hosteller'}
            />
            <input
              type="text"
              placeholder="Warden Name"
              className="glow-input"
              value={member.wardenName}
              onChange={(e) => handleMemberChange(setter, 'wardenName', e.target.value)}
              required={member.residenceType === 'Hosteller'}
            />
            <input
              type="text"
              placeholder="Warden Phone Number"
              className="glow-input"
              value={member.wardenPhone}
              onChange={(e) => handleMemberChange(setter, 'wardenPhone', e.target.value)}
              required={member.residenceType === 'Hosteller'}
            />
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-4xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="title-glow text-3xl">Team Registration (4 members)</h2>
          <button onClick={handleLogout} className="glow-btn text-sm px-4 py-2">
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="scrollable-form">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Team Name"
                className="glow-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>

            {renderMemberFields(leader, setLeader, 'Team Leader')}
            {renderMemberFields(member1, setMember1, 'Member 1')}
            {renderMemberFields(member2, setMember2, 'Member 2')}
            {renderMemberFields(member3, setMember3, 'Member 3')}
          </div>

          <button type="submit" className="glow-btn w-full mt-4" disabled={loading}>
            {loading ? 'Registering...' : 'Register Team'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegistrationForm4;
