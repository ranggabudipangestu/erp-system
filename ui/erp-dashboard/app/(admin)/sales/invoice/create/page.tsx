'use client';

import { useState } from 'react';
import Link from 'next/link';
import InvoiceDetails from '@/components/invoice/InvoiceDetails';
import AddProducts from '@/components/invoice/AddProducts';
import AdditionalCosts from '@/components/invoice/AdditionalCosts';
import Review from '@/components/invoice/Review';

type Product = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
};

type InvoiceData = {
  // Step 1: Invoice Details
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  notes: string;
  
  // Step 2: Products
  products: Product[];
  
  // Step 3: Additional Costs & Tax
  shippingCost: number;
  additionalFees: number;
  taxRate: number;
  discountAmount: number;
};

type Step = {
  id: number;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    id: 1,
    title: 'Invoice Details',
    description: 'Basic invoice information'
  },
  {
    id: 2,
    title: 'Add Products',
    description: 'Invoice items and services'
  },
  {
    id: 3,
    title: 'Additional Costs',
    description: 'Tax, shipping & fees'
  },
  {
    id: 4,
    title: 'Review & Save',
    description: 'Confirm invoice details'
  }
];

export default function CreateInvoice() {
  const [currentStep, setCurrentStep] = useState(1);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    // Step 1
    invoiceNumber: '',
    customerName: '',
    customerAddress: '',
    customerEmail: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    
    // Step 2
    products: [],
    
    // Step 3
    shippingCost: 0,
    additionalFees: 0,
    taxRate: 10,
    discountAmount: 0
  });

  const updateInvoiceData = (data: Partial<InvoiceData>) => {
    setInvoiceData(prev => ({ ...prev, ...data }));
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSaveInvoice = () => {
    // TODO: Implement save logic
    console.log('Saving invoice:', invoiceData);
    alert('Invoice saved successfully!');
  };


  // Validation functions
  const isStep1Valid = () => {
    return invoiceData.invoiceNumber && invoiceData.customerName && invoiceData.invoiceDate && invoiceData.dueDate;
  };

  const isStep2Valid = () => {
    return invoiceData.products.length > 0;
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid();
      case 2:
        return isStep2Valid();
      case 3:
        return true; // Step 3 is optional
      default:
        return false;
    }
  };

  // Step component renderer
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <InvoiceDetails invoiceData={invoiceData} updateInvoiceData={updateInvoiceData} />;
      case 2:
        return <AddProducts invoiceData={invoiceData} updateInvoiceData={updateInvoiceData} />;
      case 3:
        return <AdditionalCosts invoiceData={invoiceData} updateInvoiceData={updateInvoiceData} />;
      case 4:
        return <Review invoiceData={invoiceData} onSave={handleSaveInvoice} onPrevious={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-none px-2 sm:px-4 lg:px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Invoice
        </h2>
        <nav>
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link className="font-medium text-gray-500 hover:text-gray-700" href="/">
                Home
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="font-medium text-blue-600">Create Invoice</li>
          </ol>
        </nav>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        {/* Mobile Stepper - Show only current step */}
        <div className="block md:hidden">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 border-2 border-blue-600 text-white font-medium text-lg">
                {currentStep}
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-blue-600 mb-1">
                  {steps[currentStep - 1].title}
                </p>
                <p className="text-sm text-gray-500">
                  {steps[currentStep - 1].description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Stepper - Show all steps */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium text-sm transition-colors
                    ${currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-500 hover:border-blue-400'
                    }`}
                >
                  {step.id}
                </button>
                <div className="ml-4 min-w-0">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-8 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Show title only on desktop since mobile stepper already shows it */}
        <div className="hidden md:block border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {steps[currentStep - 1].title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {steps[currentStep - 1].description}
          </p>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {renderStep()}
        </div>
        
        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="border-t border-gray-200 px-4 py-6 sm:px-6 lg:px-8 dark:border-gray-700">
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentStep === 3 ? 'Review & Finalize' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}