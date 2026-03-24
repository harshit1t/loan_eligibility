import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-background font-body p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-8">Loan Calculator Flow</h1>
      <div className="space-y-4 flex flex-col items-center">
        <Link href="/step-1" className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-primary-container transition-all">Step 1: Personal Info</Link>
        <Link href="/step-2" className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-primary-container transition-all">Step 2: Loan Details</Link>
        <Link href="/step-3" className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-primary-container transition-all">Step 3: Existing Debt</Link>
        <Link href="/step-4" className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-primary-container transition-all">Step 4: Review Summary</Link>
        <Link href="/step-5" className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-primary-container transition-all">Step 5: Result</Link>
      </div>
    </div>
  );
}
