import { useAuthStore } from '../stores/authStore.js';

export default function StaffProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-display-sm text-primary-dark">Profile</h1>
        <p className="font-body text-body-md text-warm-gray mt-1">Your staff account details.</p>
      </div>

      <div className="bg-white border border-light-gray rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sage-green flex items-center justify-center text-white font-bold text-xl">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="font-display text-body-lg text-primary-dark">{user.name}</h2>
            <p className="font-body text-body-sm text-warm-gray capitalize">{user.role}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-light-gray">
          <div>
            <dt className="font-accent text-caption uppercase tracking-wide text-warm-gray">Email</dt>
            <dd className="font-body text-body-md text-primary-dark">{user.email || 'Not set'}</dd>
          </div>
          <div>
            <dt className="font-accent text-caption uppercase tracking-wide text-warm-gray">Phone</dt>
            <dd className="font-body text-body-md text-primary-dark">{user.phone || 'Not set'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
