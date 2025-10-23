import { useState } from 'react';
// Using server-side registration endpoint instead of direct RTDB writes
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
  residenceType?: 'Day Scholar' | 'Hosteller';
  hostelName?: string;
  roomNumber?: string;
  wardenName?: string;
  wardenPhone?: string;
}

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  const [leader, setLeader] = useState<Member>({
    name: '',
    regNo: '',
    year: '',
    dept: '',
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
    residenceType: 'Day Scholar',
    hostelName: '',
    roomNumber: '',
    wardenName: '',
    wardenPhone: '',
  });

  const [member4, setMember4] = useState<Member>({
    name: '',
    regNo: '',
    year: '',
    dept: '',
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
    memberSetter((prev) => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    const members = [leader, member1, member2, member3, member4];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      // Member 4 is optional: index 4 corresponds to member4
      if (i === 4) {
        // if all fields empty, skip validation for member4
        if (!member.name && !member.regNo && !member.year && !member.dept) {
          continue;
        }
      }

      if (!member.name || !member.regNo || !member.year || !member.dept) {
        toast.error(`Please fill all fields for ${i === 0 ? 'Team Leader' : `Member ${i}`}`);
        return;
      }
    }

    // Validate per-member hostel details for members who selected Hosteller
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
      // Remove empty member4 if all fields empty
      let finalMembers = members;
      if (!members[4].name && !members[4].regNo && !members[4].year && !members[4].dept) {
        finalMembers = members.slice(0, 4);
      }

      const payload: any = {
        teamName: teamName.trim(),
        members: finalMembers,
        createdAt: new Date().toISOString(),
      };

      // Use environment variable VITE_REGISTER_ENDPOINT for the function URL or fallback to relative path
      const endpoint = (import.meta as any).env.VITE_REGISTER_ENDPOINT || '/api/registerTeam';

      // Get ID token for auth (if available)
      const token = await auth.currentUser?.getIdToken();

      const res = await postWithRetry(endpoint, payload, token);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        toast.error('Registration failed: ' + (text || res.statusText));
      } else {
        toast.success('Team Registered Successfully!');

        setTeamName('');
        const emptyMember: Member = {
          name: '',
          regNo: '',
          year: '',
          dept: '',
          residenceType: 'Day Scholar',
          hostelName: '',
          roomNumber: '',
          wardenName: '',
          wardenPhone: '',
        };

        setLeader(emptyMember);
        setMember1(emptyMember);
        setMember2(emptyMember);
        setMember3(emptyMember);
        setMember4(emptyMember);
      }
    } catch (error: any) {
      console.error('Registration error', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // POST helper with exponential backoff retries
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
          // If success OR client error, stop retrying and return response
          return res;
        }

        // For server errors (5xx), fallthrough to retry
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
      } catch (err) {
        // Network or CORS error: retry
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    // If all attempts failed, return a fake Response-like object
    return new Response(null, { status: 503, statusText: 'Service Unavailable' });
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
          placeholder="Department"
          className="glow-input"
          value={member.dept}
          onChange={(e) => handleMemberChange(setter, 'dept', e.target.value)}
          required
        />
        {/* Residence dropdown */}
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
              required
            />
            <input
              type="text"
              placeholder="Room Number"
              className="glow-input"
              value={member.roomNumber}
              onChange={(e) => handleMemberChange(setter, 'roomNumber', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Warden Name"
              className="glow-input"
              value={member.wardenName}
              onChange={(e) => handleMemberChange(setter, 'wardenName', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Warden Phone Number"
              className="glow-input"
              value={member.wardenPhone}
              onChange={(e) => handleMemberChange(setter, 'wardenPhone', e.target.value)}
              required
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
          <h2 className="title-glow text-3xl">Team Registration</h2>
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
            {renderMemberFields(member4, setMember4, 'Member 4')}

            {/* global residence UI removed - per-member residence dropdowns are used instead */}
          </div>

          <button type="submit" className="glow-btn w-full mt-4" disabled={loading}>
            {loading ? 'Registering...' : 'Register Team'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegistrationForm;
