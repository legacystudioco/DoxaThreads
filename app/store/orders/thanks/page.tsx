import { redirect } from 'next/navigation';

export default function ThanksPage() {
  redirect('/store/orders/confirmation');
}
