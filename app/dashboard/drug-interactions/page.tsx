import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { DrugInteractionClient } from './drug-interaction-client';

export default async function DrugInteractionPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">药物相互作用检查</h1>
          <p className="text-gray-600 mt-2">
            检查多种药物同时使用时的相互作用风险，确保用药安全
          </p>
        </div>
        
        <DrugInteractionClient />
      </div>
    </div>
  );
}