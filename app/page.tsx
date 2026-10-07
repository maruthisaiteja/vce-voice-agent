import Desk from '@/components/desk';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {sessionCookie,verifySession} from '@/lib/session';
export default async function Home(){if(!await verifySession((await cookies()).get(sessionCookie)?.value))redirect('/login');return <Desk/>;}
