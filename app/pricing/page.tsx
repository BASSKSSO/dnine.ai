'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  { name: 'Free', price: '$0', period: 'forever', description: 'Get started with basic background removal.', credits: 5, icon: Zap, features: ['5 free credits', 'Single image processing', 'PNG download', 'Standard quality'], cta: 'Current Plan', popular: false },
  { name: 'Pro', price: '$9', period: '/month', description: 'For regular users who need more power.', credits: 100, icon: Crown, features: ['100 credits/month', 'Bulk processing', 'HD quality output', 'Priority processing', 'Email support'], cta: 'Upgrade to Pro', popular: true },
  { name: 'Enterprise', price: '$49', period: '/month', description: 'For teams and high-volume needs.', credits: 1000, icon: Sparkles, features: ['1,000 credits/month', 'Bulk processing', 'HD quality output', 'Priority processing', 'API access', 'Dedicated support', 'Custom integrations'], cta: 'Contact Sales', popular: false },
];

export default function PricingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Simple Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Choose Your <span className="gradient-text">Plan</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Start free, upgrade when you need more. No hidden fees.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`glass-card border-0 relative overflow-hidden ${plan.popular ? 'ring-2 ring-primary shadow-xl' : ''}`}>
              {plan.popular && <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">Most Popular</div>}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                  <p className="text-sm text-muted-foreground mt-1">{plan.credits} credits included</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '/tool' : user ? '/tool' : '/auth/register'}>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {plan.name === 'Free' && user ? 'Current Plan' : plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'What happens when I run out of credits?', a: 'You can upgrade your plan or wait for monthly credit renewal. Your processed images remain accessible.' },
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. No questions asked.' },
              { q: 'What image formats are supported?', a: 'We support PNG, JPG, and WEBP formats up to 10MB per image.' },
              { q: 'Is my data safe?', a: 'Your images are processed securely and are not stored on our servers unless you explicitly save them.' },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
