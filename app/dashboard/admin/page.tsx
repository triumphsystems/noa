import { requireServerAuth } from '@/lib/auth/server';
import { getAdminDoctorsData } from '@/lib/data/admin';
import { AdminDashboardView } from '@/components/admin';
import { getAdminByEmail } from '@/lib/db';

export default async function AdminDashboardPage() {
  const auth = await requireServerAuth(['admin']);
  const { doctors, counts } = await getAdminDoctorsData();

  let adminUser = null;
  if (auth.email) {
    const adminRecord = await getAdminByEmail(auth.email);
    if (adminRecord) {
      adminUser = {
        id: adminRecord.id,
        name: adminRecord.name,
        email: adminRecord.email,
        userType: 'admin',
      };
    } else {
      adminUser = {
        id: auth.sub,
        email: auth.email,
        userType: 'admin',
      };
    }
  }

  return (
    <AdminDashboardView
      initialDoctors={doctors}
      initialCounts={counts}
      adminUser={adminUser}
    />
  );
}
