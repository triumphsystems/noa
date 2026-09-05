import { redirect } from 'next/navigation';

export default function SessionsIndexPage() {
  redirect('/dashboard/doctor/sessions/new');
}
