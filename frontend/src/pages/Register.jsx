import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Mail, Lock, User, ShoppingBag, Store } from 'lucide-react';

const ROLES = [
  {
    value: 'USER',
    label: 'Buyer',
    icon: ShoppingBag,
    description: 'Browse & buy cricket gear',
    color: '#4F46E5',
    glow: 'rgba(79, 70, 229, 0.35)',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  },
  {
    value: 'SELLER',
    label: 'Seller',
    icon: Store,
    description: 'List & sell your products',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
];

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (roleValue) => {
    setFormData({ ...formData, role: roleValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', formData);
      if (response.data && response.data.success) {
        setSuccess('Registration successful! Please login.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMsgs = typeof err.response.data.errors === 'object'
          ? Object.values(err.response.data.errors).join(', ')
          : JSON.stringify(err.response.data.errors);
        setError(errorMsgs);
      } else {
        setError(err.response?.data?.message || 'Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === formData.role);

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse at 60% 0%, rgba(79,70,229,0.12) 0%, transparent 60%), var(--background)',
      animation: 'fadeIn 0.4s ease forwards',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.25rem',
        padding: '2.5rem 2.25rem',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: selectedRole.gradient,
            boxShadow: `0 8px 24px ${selectedRole.glow}`,
            marginBottom: '1rem',
            transition: 'all 0.35s ease',
          }}>
            {React.createElement(selectedRole.icon, { size: 26, color: '#fff' })}
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Join CricketShop as a{' '}
            <span style={{ color: selectedRole.color, fontWeight: 600, transition: 'color 0.3s' }}>
              {selectedRole.label}
            </span>
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
            marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', color: 'var(--secondary)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
            marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '0.875rem',
          }}>
            {success}
          </div>
        )}

        {/* Role Selector */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            I am a
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {ROLES.map((role) => {
              const isSelected = formData.role === role.value;
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 0.5rem',
                    borderRadius: '0.75rem',
                    border: isSelected ? `2px solid ${role.color}` : '2px solid rgba(255,255,255,0.07)',
                    background: isSelected ? `rgba(${role.color.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',')}, 0.12)` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: isSelected ? `0 0 20px ${role.glow}` : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    outline: 'none',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? role.gradient : 'rgba(255,255,255,0.07)',
                    transition: 'all 0.25s ease',
                  }}>
                    <RoleIcon size={20} color={isSelected ? '#fff' : role.color} />
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? role.color : 'var(--text-secondary)',
                    transition: 'all 0.25s ease',
                  }}>
                    {role.label}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    transition: 'color 0.25s',
                  }}>
                    {role.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Full Name */}
          <div>
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                <User size={17} />
              </div>
              <input
                type="text"
                name="name"
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                <Mail size={17} />
              </div>
              <input
                type="email"
                name="email"
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                <Lock size={17} />
              </div>
              <input
                type="password"
                name="password"
                required
                minLength="8"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              marginTop: '0.25rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#fff',
              background: selectedRole.gradient,
              boxShadow: `0 4px 18px ${selectedRole.glow}`,
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Creating Account…' : `Sign Up as ${selectedRole.label}`}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <span
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/login')}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
