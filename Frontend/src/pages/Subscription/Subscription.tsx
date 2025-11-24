import { Check, Crown, ArrowLeft, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '5 stories per month',
      'Basic timeline',
      'Up to 10 characters',
      'Community support',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited stories',
      'Advanced timeline with duration',
      'Unlimited characters',
      'Priority support',
      'Export to PDF',
      'Collaboration features',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: 'per month',
    features: [
      'Everything in Pro',
      'AI story suggestions',
      'Custom themes',
      'Analytics dashboard',
      'API access',
      'White-label option',
      'Dedicated support',
    ],
    cta: 'Get Premium',
    popular: false,
  },
];

interface SubscriptionPageProps {
  onNavigate?: (page: 'home') => void;
}

export default function SubscriptionPage({ onNavigate }: SubscriptionPageProps) {
  const handleSubscribe = (planName: string) => {
    alert(`Subscribing to ${planName} plan. Payment integration coming soon!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-gray-600">Unlock powerful features to enhance your storytelling</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-purple-500 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.name)}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>All plans include 14-day money-back guarantee • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
