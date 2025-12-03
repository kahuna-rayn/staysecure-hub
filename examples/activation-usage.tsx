// Example of how to send user activation emails using Supabase
// This would typically be done from your backend or admin panel

import { useState } from 'react';
import { supabase } from '../src/config/supabase';

// Example function to send activation email to a new user
export const sendActivationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${window.location.origin}/activate-account`,
    });

    if (error) {
      throw error;
    }

    console.log('Activation email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending activation email:', error);
    return { success: false, error: error.message };
  }
};

// Example usage in an admin component
export const AdminUserInvite = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async () => {
    setLoading(true);
    setMessage('');
    
    const result = await sendActivationEmail(email);
    
    if (result.success) {
      setMessage('Activation email sent successfully!');
      setEmail('');
    } else {
      setMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <h3>Invite New User</h3>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter user email"
      />
      <button onClick={handleInvite} disabled={loading}>
        {loading ? 'Sending...' : 'Send Activation Email'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};
