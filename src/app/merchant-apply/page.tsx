'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  MY_STATES,
  validateIdNumber,
  validateMyPhone,
  validateSSM,
} from '@/lib/my-validators';

type IdType = 'nric' | 'passport';
type BizType = 'sole_prop' | 'sdn_bhd' | 'llp' | 'other';
type Category = 'salon' | 'barbershop' | 'car_wash' | 'spa' | 'other';

const BIZ_TYPE_LABELS: Record<BizType, string> = {
  sole_prop: 'Sole proprietorship / Enterprise',
  sdn_bhd: 'Sendirian Berhad (Sdn Bhd)',
  llp: 'Limited Liability Partnership (LLP)',
  other: 'Other',
};

const CATEGORY_LABELS: Record<Category, string> = {
  salon: 'Salon',
  barbershop: 'Barbershop',
  car_wash: 'Car Wash',
  spa: 'Spa',
  other: 'Other',
};

export default function MerchantApplyPage() {
  const router = useRouter();
  const { authUser, profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);

  // Owner
  const [ownerName, setOwnerName] = useState('');
  const [idType, setIdType] = useState<IdType>('nric');
  const [idNumber, setIdNumber] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Business
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [bizType, setBizType] = useState<BizType>('sole_prop');
  const [regNumber, setRegNumber] = useState('');
  const [category, setCategory] = useState<Category>('barbershop');

  // Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateMy, setStateMy] = useState<string>('Selangor');
  const [postcode, setPostcode] = useState('');

  // Optional
  const [sstNumber, setSstNumber] = useState('');
  const [councilAuthority, setCouncilAuthority] = useState('');
  const [councilNumber, setCouncilNumber] = useState('');
  const [councilExpiry, setCouncilExpiry] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace('/signup?role=merchant&redirect=/apply');
      return;
    }
    // Already a live merchant → go to dashboard
    if (profile?.role === 'merchant') router.replace('/dashboard');
    // Already pending → review page
    if (profile?.role === 'pending_merchant') router.replace('/pending');
  }, [authLoading, authUser, profile, router]);

  const stepValidation = useMemo(() => {
    const errs: string[] = [];
    if (step >= 1) {
      if (ownerName.trim().length < 2) errs.push('Enter your full name.');
      const idCheck = validateIdNumber(idType, idNumber);
      if (!idCheck.ok) errs.push(idCheck.reason ?? 'Invalid ID.');
      const phoneCheck = validateMyPhone(ownerPhone);
      if (!phoneCheck.ok) errs.push(phoneCheck.reason ?? 'Invalid MY phone.');
    }
    if (step >= 2) {
      if (legalName.trim().length < 2) errs.push('Business legal name required.');
      const ssm = validateSSM(regNumber);
      if (!ssm.ok) errs.push(ssm.reason ?? 'Invalid SSM format.');
    }
    if (step >= 3) {
      if (address.trim().length < 5) errs.push('Full address required.');
      if (!postcode.match(/^\d{5}$/)) errs.push('Postcode must be 5 digits.');
    }
    return errs;
  }, [step, ownerName, idType, idNumber, ownerPhone, legalName, regNumber, address, postcode]);

  function canAdvanceFrom(n: number): boolean {
    return stepValidation.length === 0 || step > n;
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const phoneOk = validateMyPhone(ownerPhone);
      const idOk = validateIdNumber(idType, idNumber);
      const ssmOk = validateSSM(regNumber);
      if (!phoneOk.ok || !idOk.ok || !ssmOk.ok) {
        throw new Error('Please fix validation errors above.');
      }

      const res = await fetch('/api/merchant/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: ownerName,
          owner_id_type: idType,
          owner_id_number: idOk.normalized,
          owner_phone: phoneOk.normalized,
          country: 'MY',
          business_legal_name: legalName,
          business_trading_name: tradingName || undefined,
          business_type: bizType,
          primary_reg_number: ssmOk.normalized,
          category,
          address,
          city: city || undefined,
          state: stateMy || undefined,
          postcode,
          sst_number: sstNumber || undefined,
          council_licence_authority: councilAuthority || undefined,
          council_licence_number: councilNumber || undefined,
          council_licence_expiry: councilExpiry || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      router.replace('/pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            Merchant application
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">List your business on BookOurSpot</h1>
          <p className="text-sm text-gray-500 mt-1">
            We verify each merchant before listing goes live — usually within 1 business day.
          </p>
        </header>

        {/* Stepper */}
        <div className="flex gap-2 text-xs">
          {['Owner', 'Business', 'Location', 'Review'].map((label, idx) => {
            const n = idx + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div
                key={label}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  active
                    ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {n}. {label}
              </div>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          {step === 1 ? (
            <>
              <h2 className="font-semibold text-gray-900">Owner identity</h2>
              <p className="text-xs text-gray-500">
                We store your NRIC/passport hashed; only the last 4 digits stay visible to
                admins. Data never shown to customers.
              </p>
              <Input
                label="Full name (as per NRIC/passport)"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ahmad Bin Abdullah"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="block mb-1.5 font-medium text-gray-700">ID type</span>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IdType)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <option value="nric">NRIC (MyKad)</option>
                    <option value="passport">Passport</option>
                  </select>
                </label>
                <Input
                  label={idType === 'nric' ? 'NRIC (YYMMDD-PB-XXXX)' : 'Passport number'}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={idType === 'nric' ? '900101-14-5678' : 'A12345678'}
                  required
                />
              </div>
              <Input
                label="Mobile phone (Malaysia)"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="012 345 6789"
                required
                autoComplete="tel"
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="font-semibold text-gray-900">Business details</h2>
              <Input
                label="Legal business name (as registered with SSM)"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
              />
              <Input
                label="Trading name / brand (optional — what customers see)"
                value={tradingName}
                onChange={(e) => setTradingName(e.target.value)}
                placeholder="Leave blank to use legal name"
              />
              <label className="text-sm">
                <span className="block mb-1.5 font-medium text-gray-700">Business type</span>
                <select
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value as BizType)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  {Object.entries(BIZ_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="SSM registration number"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="202001012345 or 123456-A"
                required
              />
              <label className="text-sm">
                <span className="block mb-1.5 font-medium text-gray-700">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h2 className="font-semibold text-gray-900">Location + optional regulatory</h2>
              <Input
                label="Business address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Lot 1-2, Ground Floor, Jalan SS 21/1A"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Petaling Jaya"
                />
                <Input
                  label="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="47400"
                  required
                />
              </div>
              <label className="text-sm">
                <span className="block mb-1.5 font-medium text-gray-700">State</span>
                <select
                  value={stateMy}
                  onChange={(e) => setStateMy(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  {MY_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs text-gray-500">
                  Optional — add now if you have them, or upload later from the dashboard.
                </p>
                <Input
                  label="SST number (if registered)"
                  value={sstNumber}
                  onChange={(e) => setSstNumber(e.target.value)}
                  placeholder="W12-3456-78901234"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Council licence authority"
                    value={councilAuthority}
                    onChange={(e) => setCouncilAuthority(e.target.value)}
                    placeholder="DBKL / MBPJ / MBSA"
                  />
                  <Input
                    label="Licence number"
                    value={councilNumber}
                    onChange={(e) => setCouncilNumber(e.target.value)}
                  />
                </div>
                <Input
                  label="Licence expiry date"
                  type="date"
                  value={councilExpiry}
                  onChange={(e) => setCouncilExpiry(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <h2 className="font-semibold text-gray-900">Review & submit</h2>
              <dl className="text-sm grid grid-cols-2 gap-y-1.5">
                <dt className="text-gray-500">Owner</dt>
                <dd className="text-gray-900">{ownerName}</dd>
                <dt className="text-gray-500">{idType === 'nric' ? 'NRIC' : 'Passport'}</dt>
                <dd className="text-gray-900 font-mono">
                  ···· {validateIdNumber(idType, idNumber).last4}
                </dd>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{validateMyPhone(ownerPhone).normalized}</dd>
                <dt className="text-gray-500">Business</dt>
                <dd className="text-gray-900">
                  {tradingName || legalName}
                  <span className="text-xs text-gray-500"> ({BIZ_TYPE_LABELS[bizType]})</span>
                </dd>
                <dt className="text-gray-500">SSM</dt>
                <dd className="text-gray-900 font-mono">{regNumber}</dd>
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{CATEGORY_LABELS[category]}</dd>
                <dt className="text-gray-500">Address</dt>
                <dd className="text-gray-900">
                  {address}, {city ? `${city}, ` : ''}
                  {postcode} {stateMy}
                </dd>
                {sstNumber ? (
                  <>
                    <dt className="text-gray-500">SST</dt>
                    <dd className="text-gray-900 font-mono">{sstNumber}</dd>
                  </>
                ) : null}
                {councilNumber ? (
                  <>
                    <dt className="text-gray-500">Licence</dt>
                    <dd className="text-gray-900">
                      {councilAuthority} · {councilNumber}
                      {councilExpiry ? ` (exp ${councilExpiry})` : ''}
                    </dd>
                  </>
                ) : null}
              </dl>
              <p className="text-xs text-gray-500">
                By submitting, you confirm the details above are accurate and you are authorised
                to register this business.
              </p>
            </>
          ) : null}

          {step < 4 && stepValidation.length > 0 ? (
            <ul className="text-xs text-red-600 space-y-0.5">
              {stepValidation.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex justify-between pt-2">
            {step > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : (
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 self-center"
              >
                Cancel
              </Link>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvanceFrom(step)}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={submit} loading={loading}>
                Submit application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
