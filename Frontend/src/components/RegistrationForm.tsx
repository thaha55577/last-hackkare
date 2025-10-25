import { useState } from 'react';
import { ref, set as dbSet } from 'firebase/database';
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

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

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
  };

  const [leader, setLeader] = useState<Member>(emptyMember);
  const [member1, setMember1] = useState<Member>(emptyMember);
  const [member2, setMember2] = useState<Member>(emptyMember);
  const [member3, setMember3] = useState<Member>(emptyMember);
  const [member4, setMember4] = useState<Member>(emptyMember);

  const handleMemberChange = (
    memberSetter: React.Dispatch<React.SetStateAction<Member>>,
    field: keyof Member,
    value: string
  ) => {
    if (field === 'dept') {
      value = value.toUpperCase();
    }
    if (["year", "regNo", "wardenPhone", "phone", "roomNumber"].includes(field)) {
      // Remove any non-numeric characters
      value = value.replace(/[^0-9]/g, "");
      // Limit phone numbers to 10 digits
      if ((field === 'phone' || field === 'wardenPhone') && value.length > 10) {
        value = value.slice(0, 10);
      }
      // Limit year to 1 digit
      if (field === 'year' && value.length > 1) {
        value = value.slice(0, 1);
      }
    }
    memberSetter((prev) => ({ ...prev, [field]: value }));
  };

  const renderMemberFields = (
    member: Member,
    setter: React.Dispatch<React.SetStateAction<Member>>,
    label: string
  ): JSX.Element => (
    <div className="mb-6 p-3 sm:p-4 border border-cyan-500/30 rounded-lg">
      <h3 className="text-cyan-300 font-semibold mb-3 text-lg sm:text-xl" style={{ fontFamily: 'Orbitron' }}>
        {label}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <input 
          type="text" 
          placeholder="Name" 
          className="glow-input" 
          value={member.name} 
          onChange={e => handleMemberChange(setter, 'name', e.target.value)} 
          required 
        />
        <input 
          type="text" 
          inputMode="numeric" 
          pattern="[0-9]*" 
          placeholder="Register Number" 
          className="glow-input" 
          value={member.regNo} 
          onChange={e => handleMemberChange(setter, 'regNo', e.target.value)} 
          required 
        />
        <input 
          type="text" 
          inputMode="numeric" 
          pattern="[0-9]*" 
          maxLength={1}
          placeholder="Year (1-4)" 
          className="glow-input" 
          value={member.year} 
          onChange={e => handleMemberChange(setter, 'year', e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Department" 
          className="glow-input" 
          value={member.dept} 
          onChange={e => handleMemberChange(setter, 'dept', e.target.value)} 
          style={{ textTransform: 'uppercase' }} 
          required 
        />
        <input 
          type="text" 
          inputMode="numeric" 
          pattern="[0-9]*" 
          placeholder="Phone Number (10 digits)" 
          className="glow-input" 
          value={member.phone} 
          onChange={e => handleMemberChange(setter, 'phone', e.target.value)} 
          maxLength={10}
          required 
        />
        <select 
          className="glow-input" 
          value={member.residenceType} 
          onChange={e => handleMemberChange(setter, 'residenceType', e.target.value)}
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
          className="mt-3 sm:mt-4 p-3 sm:p-4 border border-cyan-500/30 rounded-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <input 
              type="text" 
              placeholder="Hostel Name" 
              className="glow-input" 
              value={member.hostelName} 
              onChange={e => handleMemberChange(setter, 'hostelName', e.target.value)} 
              required 
            />
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Room Number" 
              className="glow-input" 
              value={member.roomNumber} 
              onChange={e => handleMemberChange(setter, 'roomNumber', e.target.value)} 
              required={member.residenceType === 'Hosteller'}
            />
            <input 
              type="text" 
              placeholder="Warden Name" 
              className="glow-input" 
              value={member.wardenName} 
              onChange={e => handleMemberChange(setter, 'wardenName', e.target.value)} 
              required 
            />
            <input 
              type="text" 
              inputMode="numeric" 
              pattern="[0-9]*" 
              placeholder="Warden Phone Number (10 digits)" 
              className="glow-input" 
              value={member.wardenPhone} 
              onChange={e => handleMemberChange(setter, 'wardenPhone', e.target.value)} 
              maxLength={10}
              required 
            />
          </div>
        </motion.div>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    const members = [leader, member1, member2, member3, member4];

    // Validate required fields and phone numbers
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      // Skip validation for member4 if all fields are empty
      if (i === 4 && !member.name && !member.regNo && !member.year && !member.dept && !member.phone) {
        continue;
      }

      if (!member.name || !member.regNo || !member.year || !member.dept || !member.phone) {
        toast.error(`Please fill all fields for ${i === 0 ? 'Team Leader' : `Member ${i}`}`);
        return;
      }

      if (member.phone.length !== 10) {
        toast.error(`Phone number for ${i === 0 ? 'Team Leader' : `Member ${i}`} must be 10 digits`);
        return;
      }

      // Validate year is between 1-4
      const yearNum = parseInt(member.year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
        toast.error(`Year for ${i === 0 ? 'Team Leader' : `Member ${i}`} must be between 1 and 4`);
        return;
      }
    }

    // Validate hostel details
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (m.residenceType === 'Hosteller') {
        if (!m.hostelName || !m.roomNumber || !m.wardenName || !m.wardenPhone) {
          toast.error(`Please fill all hostel fields for ${i === 0 ? 'Team Leader' : `Member ${i}`}`);
          return;
        }
        if (m.wardenPhone.length !== 10) {
          toast.error(`Warden phone for ${i === 0 ? 'Team Leader' : `Member ${i}`} must be 10 digits`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      let finalMembers = members;
      if (!members[4].name && !members[4].regNo && !members[4].year && !members[4].dept && !members[4].phone) {
        finalMembers = members.slice(0, 4);
      }

      const payload: any = {
        teamName: teamName.trim(),
        members: finalMembers,
        createdAt: new Date().toISOString(),
      };

      const env = (import.meta as any).env || {};
      const endpoint = env.VITE_REGISTER_ENDPOINT || `${env.BASE_URL ?? '/'}api/registerTeam`;
      const useDirect = !env.VITE_REGISTER_ENDPOINT;
      const token = await auth.currentUser?.getIdToken();

      let didSave = false;

      if (useDirect) {
        try {
          await dbSet(ref(db, 'teams/' + teamName.trim()), { 
            members: finalMembers, 
            createdAt: Date.now() 
          });
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
              await dbSet(ref(db, 'teams/' + teamName.trim()), { 
                members: finalMembers, 
                createdAt: Date.now() 
              });
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
        setTeamName('');
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

  const postWithRetry = async (url: string, body: any, idToken?: string) => {
    const maxAttempts = 5;
    const baseDelay = 400;
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:px-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="title-glow text-3xl">Team Registration (5 Members)</h2>
          <button 
            onClick={handleLogout} 
            className="glow-btn text-sm px-4 py-2"
          >
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
                onChange={e => setTeamName(e.target.value)} 
                required 
              />
            </div>

            {renderMemberFields(leader, setLeader, 'Team Leader')}
            {renderMemberFields(member1, setMember1, 'Member 1')}
            {renderMemberFields(member2, setMember2, 'Member 2')}
            {renderMemberFields(member3, setMember3, 'Member 3')}
            {renderMemberFields(member4, setMember4, 'Member 4')}
          </div>

          <button 
            type="submit" 
            className="glow-btn w-full mt-4" 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Team'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegistrationForm;