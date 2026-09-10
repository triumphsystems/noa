import { requireServerAuth, getServerProfile } from '@/lib/auth/server';
import { getAdminDoctorsData } from '@/lib/data/admin';
import { AdminDashboardView } from '@/components/admin';

export default async function AdminDashboardPage() {
  const auth = await requireServerAuth(['admin']);
  const [profile, { doctors, counts }] = await Promise.all([
    getServerProfile(),
    getAdminDoctorsData(),
  ]);

  const adminUser = profile
    ? {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        userType: 'admin',
      }
    : {
        id: auth.sub,
        email: auth.email,
        userType: 'admin',
      };

  return (
    <AdminDashboardView
      initialDoctors={doctors}
      initialCounts={counts}
      adminUser={adminUser}
    />
  );
}
