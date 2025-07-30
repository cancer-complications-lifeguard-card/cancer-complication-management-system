import DrugInteractionChecker from '@/components/medical/DrugInteractionChecker';

export default function DrugInteractionsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">药物相互作用检查</h1>
        <p className="text-gray-600 mt-2">
          检查多个药物之间可能存在的相互作用和安全风险
        </p>
      </div>
      <DrugInteractionChecker />
    </div>
  );
}