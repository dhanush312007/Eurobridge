import React, { useState, useEffect } from 'react';
import { 
  ApplicantProfile, 
  GermanCityData, 
  RelocationBudgetPlan 
} from '../types/index.ts';
import { GERMAN_CITIES_DATA } from '../../server/data/cities.ts';
import { 
  DollarSign, 
  Building, 
  MapPin, 
  Compass, 
  ArrowRight, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  TrendingUp, 
  Layers, 
  Info,
  Calendar,
  Wallet,
  Sparkles
} from 'lucide-react';

interface LifeLensProps {
  profile: ApplicantProfile;
  onNavigateTab: (tab: string) => void;
}

export const LifeLens: React.FC<LifeLensProps> = ({
  profile,
  onNavigateTab
}) => {
  const [cities] = useState<GermanCityData[]>(GERMAN_CITIES_DATA);
  const [selectedCityId, setSelectedCityId] = useState<string>('berlin');
  const [comparisonCityId, setComparisonCityId] = useState<string>('munich');
  
  // Budget Planner Inputs
  const [accommodationType, setAccommodationType] = useState<'SHARED_WG' | 'SINGLE_STUDIO'>('SHARED_WG');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [currency, setCurrency] = useState<'EUR' | 'INR'>('EUR');
  const [exchangeRate, setExchangeRate] = useState<number>(90.5);
  
  const [availableSavings, setAvailableSavings] = useState<number>(
    profile.blockedAccountPrepared ? 11904 : 8000
  );
  
  const [incomeSource, setIncomeSource] = useState<RelocationBudgetPlan['incomeSourceType']>(
    profile.targetPathway === 'AUSBILDUNG' ? 'AUSBILDUNG_STIPEND' : 
    profile.blockedAccountPrepared ? 'BLOCKED_ACCOUNT_DISBURSEMENT' : 'MINIJOB'
  );

  const [monthlyExpectedIncome, setMonthlyExpectedIncome] = useState<number>(
    profile.targetPathway === 'AUSBILDUNG' ? 1100 :
    profile.blockedAccountPrepared ? 992 : 538
  );

  const selectedCity = cities.find(c => c.id === selectedCityId) || cities[0];
  const comparisonCity = cities.find(c => c.id === comparisonCityId) || cities[1];

  // Update expected income when incomeSource changes
  const handleIncomeSourceChange = (src: RelocationBudgetPlan['incomeSourceType']) => {
    setIncomeSource(src);
    if (src === 'NONE') setMonthlyExpectedIncome(0);
    else if (src === 'BLOCKED_ACCOUNT_DISBURSEMENT') setMonthlyExpectedIncome(992);
    else if (src === 'MINIJOB') setMonthlyExpectedIncome(538);
    else if (src === 'WERKSTUDENT') setMonthlyExpectedIncome(1150);
    else if (src === 'AUSBILDUNG_STIPEND') setMonthlyExpectedIncome(1100);
    else if (src === 'EMPLOYMENT_SALARY') setMonthlyExpectedIncome(2800);
    else if (src === 'SCHOLARSHIP') setMonthlyExpectedIncome(934);
  };

  // Deterministic Expense Calculation
  const calculateCityExpenses = (city: GermanCityData) => {
    const rent = accommodationType === 'SINGLE_STUDIO' ? city.rentSingleStudioEur : city.rentSharedWGEur;
    const monthlyTotal = 
      rent + 
      city.foodGroceriesEur + 
      city.transportEur + 
      city.healthInsuranceEur + 
      city.utilitiesGeEur + 
      city.mobileInternetEur + 
      city.personalLeisureEur + 
      Math.round(city.semesterContributionEur / 6);
    
    const annualTotal = monthlyTotal * 12;
    const durationTotal = monthlyTotal * durationMonths;
    const netBalance = monthlyExpectedIncome - monthlyTotal;
    const totalDeficit = Math.max(0, durationTotal - (monthlyExpectedIncome * durationMonths));
    const shortfallVsBlockedAccount = Math.max(0, 11904 - availableSavings);

    return {
      rent,
      monthlyTotal,
      annualTotal,
      durationTotal,
      netBalance,
      totalDeficit,
      shortfallVsBlockedAccount,
      runwayMonths: netBalance < 0 
        ? Math.min(durationMonths, Math.floor(availableSavings / Math.abs(netBalance))) 
        : durationMonths
    };
  };

  const primaryPlan = calculateCityExpenses(selectedCity);
  const comparisonPlan = calculateCityExpenses(comparisonCity);

  // Format currency helpers
  const formatMoney = (eurAmount: number) => {
    if (currency === 'INR') {
      const inr = Math.round(eurAmount * exchangeRate);
      return `₹${inr.toLocaleString('en-IN')}`;
    }
    return `€${eurAmount.toLocaleString('de-DE')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Editorial Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE INTELLIGENCE SUITE</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>FEATURE 03</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Relocation Finance</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            EUROBRIDGE LifeLens
          </h1>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-2 max-w-3xl font-light leading-relaxed">
            Deterministic living cost & relocation intelligence across 10 German cities. Sourced directly from DAAD, Deutsches Studierendenwerk, and federal cost indexes. Never calculates using arbitrary guesses.
          </p>
        </div>

        {/* Currency & Exchange Rate Controls */}
        <div className="p-3 bg-[#161A18] border border-white/10 rounded-2xl flex items-center gap-3 shrink-0">
          <div className="flex p-0.5 bg-[#111413] rounded-lg border border-white/10 text-xs font-mono-numbers">
            <button
              type="button"
              onClick={() => setCurrency('EUR')}
              className={`px-3 py-1 rounded transition-colors ${
                currency === 'EUR' ? 'bg-[#C5A880] text-[#0B0D0C] font-semibold' : 'text-[#9C968A] hover:text-[#FAF6F0]'
              }`}
            >
              EUR (€)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1 rounded transition-colors ${
                currency === 'INR' ? 'bg-[#C5A880] text-[#0B0D0C] font-semibold' : 'text-[#9C968A] hover:text-[#FAF6F0]'
              }`}
            >
              INR (₹)
            </button>
          </div>

          <div className="text-[11px] font-mono-numbers text-[#9C968A]">
            <span>1 € = </span>
            <input
              type="number"
              step="0.1"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value) || 90.5)}
              className="w-14 bg-[#111413] border border-white/10 rounded px-1.5 py-0.5 text-xs text-[#FAF6F0] text-center ml-1"
            />
            <span> ₹</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: City Selection & Budget Parameters Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols): Parameter Controls */}
        <div className="lg:col-span-5 bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="border-b border-white/[0.08] pb-3">
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Financial Configuration
            </span>
            <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
              Personal Budget Builder
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Primary City Selection */}
            <div>
              <label className="block font-medium text-[#FAF6F0] mb-1.5">
                Primary Target City in Germany
              </label>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cityName} ({c.stateName}) — ~€{c.monthlyEstimatedTotalEur.sharedWG}/mo (WG)
                  </option>
                ))}
              </select>
            </div>

            {/* Accommodation Type */}
            <div>
              <label className="block font-medium text-[#FAF6F0] mb-1.5">
                Accommodation Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccommodationType('SHARED_WG')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    accommodationType === 'SHARED_WG' 
                      ? 'bg-[#1C201E] border-[#C5A880] text-[#FAF6F0] font-semibold' 
                      : 'bg-[#161A18] border-white/10 text-[#9C968A]'
                  }`}
                >
                  <p className="font-semibold text-xs text-[#FAF6F0]">Shared WG-Zimmer</p>
                  <p className="text-[10px] text-[#9C968A] mt-0.5">Most common for students (€{selectedCity.rentSharedWGEur}/mo)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccommodationType('SINGLE_STUDIO')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    accommodationType === 'SINGLE_STUDIO' 
                      ? 'bg-[#1C201E] border-[#C5A880] text-[#FAF6F0] font-semibold' 
                      : 'bg-[#161A18] border-white/10 text-[#9C968A]'
                  }`}
                >
                  <p className="font-semibold text-xs text-[#FAF6F0]">Private Studio / 1-Zimmer</p>
                  <p className="text-[10px] text-[#9C968A] mt-0.5">Higher privacy (€{selectedCity.rentSingleStudioEur}/mo)</p>
                </button>
              </div>
            </div>

            {/* Available Savings / Blocked Account */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-medium text-[#FAF6F0]">
                  Available Savings / Prepared Funds
                </label>
                <span className="font-mono-numbers text-[#C5A880] text-xs">
                  {formatMoney(availableSavings)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="500"
                value={availableSavings}
                onChange={(e) => setAvailableSavings(Number(e.target.value))}
                className="w-full accent-[#C5A880] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-numbers text-[#9C968A] mt-1">
                <span>€0</span>
                <span className="text-[#C5A880]">Statutory Benchmark: €11,904</span>
                <span>€25,000</span>
              </div>
            </div>

            {/* Expected Monthly Income Source */}
            <div>
              <label className="block font-medium text-[#FAF6F0] mb-1.5">
                Expected Inflow / Work Source
              </label>
              <select
                value={incomeSource}
                onChange={(e) => handleIncomeSourceChange(e.target.value as any)}
                className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="NONE">None (Rely purely on existing savings)</option>
                <option value="BLOCKED_ACCOUNT_DISBURSEMENT">Blocked Account Monthly Payout (€992 / mo)</option>
                <option value="MINIJOB">Minijob (Up to €538 / mo tax-free)</option>
                <option value="WERKSTUDENT">Werkstudent Tech / Engineering (~€1,150 / mo)</option>
                <option value="AUSBILDUNG_STIPEND">Ausbildung Monthly Training Stipend (~€1,100 / mo)</option>
                <option value="EMPLOYMENT_SALARY">Full-Time Skilled Professional Salary (~€2,800 net / mo)</option>
                <option value="SCHOLARSHIP">DAAD / University Academic Scholarship (~€934 / mo)</option>
              </select>
            </div>

            {/* Stay Duration */}
            <div>
              <label className="block font-medium text-[#FAF6F0] mb-1.5">
                Planned Stay Duration
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              >
                <option value={6}>1 Semester (6 Months)</option>
                <option value={12}>1 Academic Year (12 Months - Visa Benchmark)</option>
                <option value={18}>3 Semesters (18 Months)</option>
                <option value={24}>Complete 2-Year Master (24 Months)</option>
              </select>
            </div>
          </div>

          {/* Autopilot Simulation Cross-Link */}
          <div className="p-4 bg-[#161A18] border border-[#C5A880]/30 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">
              Autopilot Connected
            </span>
            <p className="text-[11px] text-[#9C968A] leading-relaxed">
              Want to see how saving €2,000 more or getting an Ausbildung stipend affects your visa qualification score?
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('future-twin')}
              className="text-[11px] font-semibold text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>Test Financial Upgrades in FutureTwin</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Sourced Cost Breakdown & Financial Health Report */}
        <div className="lg:col-span-7 bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Location Intelligence
              </span>
              <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
                {selectedCity.cityName}, {selectedCity.stateName}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Estimated Monthly Cost</span>
              <p className="font-serif-display text-3xl font-medium text-[#C5A880]">
                {formatMoney(primaryPlan.monthlyTotal)}<span className="text-xs text-[#9C968A]">/mo</span>
              </p>
            </div>
          </div>

          {/* Sourced Monthly Expense Breakdown Table */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#9C968A] block">
              Official Expense Breakdown ({selectedCity.cityName})
            </span>

            <div className="bg-[#161A18] border border-white/10 rounded-xl divide-y divide-white/[0.06] overflow-hidden">
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#FAF6F0]">Warm Rent ({accommodationType === 'SHARED_WG' ? 'WG-Zimmer' : 'Studio'})</span>
                <span className="font-mono-numbers font-medium text-[#FAF6F0]">{formatMoney(primaryPlan.rent)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#EDE8DE]">Food & Daily Groceries</span>
                <span className="font-mono-numbers text-[#FAF6F0]">{formatMoney(selectedCity.foodGroceriesEur)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#EDE8DE]">Public Transportation (Deutschlandticket)</span>
                <span className="font-mono-numbers text-[#FAF6F0]">{formatMoney(selectedCity.transportEur)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#EDE8DE]">Statutory Student Health Insurance (TK / Barmer)</span>
                <span className="font-mono-numbers text-[#FAF6F0]">{formatMoney(selectedCity.healthInsuranceEur)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#EDE8DE]">Power, Heating & Rundfunkbeitrag (GEZ TV Fee)</span>
                <span className="font-mono-numbers text-[#FAF6F0]">{formatMoney(selectedCity.utilitiesGeEur)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#EDE8DE]">Mobile SIM & High-Speed Internet</span>
                <span className="font-mono-numbers text-[#FAF6F0]">{formatMoney(selectedCity.mobileInternetEur)}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-[#EDE8DE]">Personal & Leisure Allowance</span>
                <span className="font-mono-numbers text-[#FAF6F0]">{formatMoney(selectedCity.personalLeisureEur)}</span>
              </div>
              <div className="p-3 flex justify-between items-center bg-[#111413]">
                <span className="text-[#9C968A]">University Semester Contribution (Amortized / Month)</span>
                <span className="font-mono-numbers text-[#9C968A]">{formatMoney(Math.round(selectedCity.semesterContributionEur / 6))}</span>
              </div>
            </div>
          </div>

          {/* Financial Runway & Net Health Card */}
          <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-4 text-xs">
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">
              Financial Health & Statutory Runway ({durationMonths} Months)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#111413] rounded-lg">
                <span className="text-[10px] text-[#9C968A] block">Net Monthly Cashflow</span>
                <p className={`font-mono-numbers text-base font-semibold mt-0.5 ${
                  primaryPlan.netBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {primaryPlan.netBalance >= 0 ? `+${formatMoney(primaryPlan.netBalance)}` : `-${formatMoney(Math.abs(primaryPlan.netBalance))}`}
                </p>
              </div>

              <div className="p-3 bg-[#111413] rounded-lg">
                <span className="text-[10px] text-[#9C968A] block">Total Stay Requirement</span>
                <p className="font-mono-numbers text-base font-semibold text-[#FAF6F0] mt-0.5">
                  {formatMoney(primaryPlan.durationTotal)}
                </p>
              </div>

              <div className="p-3 bg-[#111413] rounded-lg col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#9C968A] block">Savings Runway</span>
                <p className={`font-mono-numbers text-base font-semibold mt-0.5 ${
                  primaryPlan.runwayMonths >= durationMonths ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {primaryPlan.runwayMonths >= durationMonths ? `${durationMonths} mos (Fully Funded)` : `${primaryPlan.runwayMonths} of ${durationMonths} mos`}
                </p>
              </div>
            </div>

            {/* Blocked Account Statutory Benchmark Note */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
              <span className="text-[#9C968A]">
                Official § 16b Blocked Account Benchmark: €11,904
              </span>
              <span className={`font-mono-numbers font-medium ${
                availableSavings >= 11904 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {availableSavings >= 11904 
                  ? '✓ Minimum Statutory Requirement Satisfied' 
                  : `Shortfall: ${formatMoney(primaryPlan.shortfallVsBlockedAccount)}`}
              </span>
            </div>
          </div>

          {/* Authoritative Source Reference Footnote */}
          <div className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl space-y-1 text-[11px] text-[#9C968A]">
            <div className="flex items-center justify-between font-medium text-[#FAF6F0]">
              <span>Verified Source Catalog: {selectedCity.sourceReference.sourceName}</span>
              <a
                href={selectedCity.sourceReference.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5A880] hover:underline flex items-center gap-1"
              >
                <span>Verify Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="italic text-[#9C968A]">
              "{selectedCity.sourceReference.notes}" (Last verified: {selectedCity.sourceReference.lastVerifiedDate})
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Side-by-Side Dual City Cost Comparison */}
      <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Comparative Relocation Matrix
            </span>
            <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
              Compare German Cities: {selectedCity.cityName} vs. {comparisonCity.cityName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9C968A]">Compare with:</span>
            <select
              value={comparisonCityId}
              onChange={(e) => setComparisonCityId(e.target.value)}
              className="bg-[#161A18] border border-white/10 rounded-lg p-2 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
            >
              {cities.filter(c => c.id !== selectedCityId).map(c => (
                <option key={c.id} value={c.id}>
                  {c.cityName} ({c.stateName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* City 1 Card */}
          <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-4">
            <div className="flex justify-between items-baseline border-b border-white/[0.08] pb-2">
              <h4 className="font-serif-display text-xl text-[#FAF6F0]">{selectedCity.cityName}</h4>
              <span className="font-mono-numbers font-semibold text-[#C5A880]">
                {formatMoney(primaryPlan.monthlyTotal)} / mo
              </span>
            </div>

            <div className="space-y-2 text-[#9C968A]">
              <div className="flex justify-between">
                <span>Rent ({accommodationType === 'SHARED_WG' ? 'WG' : 'Studio'}):</span>
                <span className="font-medium text-[#FAF6F0]">{formatMoney(primaryPlan.rent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Cost (12 mos):</span>
                <span className="font-medium text-[#FAF6F0]">{formatMoney(primaryPlan.annualTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Key University / Tech Hubs:</span>
                <span className="text-[#EDE8DE] truncate max-w-[200px]">{selectedCity.keyHubs.slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>

          {/* City 2 Card */}
          <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-4">
            <div className="flex justify-between items-baseline border-b border-white/[0.08] pb-2">
              <h4 className="font-serif-display text-xl text-[#FAF6F0]">{comparisonCity.cityName}</h4>
              <span className="font-mono-numbers font-semibold text-[#C5A880]">
                {formatMoney(comparisonPlan.monthlyTotal)} / mo
              </span>
            </div>

            <div className="space-y-2 text-[#9C968A]">
              <div className="flex justify-between">
                <span>Rent ({accommodationType === 'SHARED_WG' ? 'WG' : 'Studio'}):</span>
                <span className="font-medium text-[#FAF6F0]">{formatMoney(comparisonPlan.rent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Cost (12 mos):</span>
                <span className="font-medium text-[#FAF6F0]">{formatMoney(comparisonPlan.annualTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Difference:</span>
                <span className={`font-mono-numbers font-medium ${
                  comparisonPlan.monthlyTotal > primaryPlan.monthlyTotal ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {comparisonPlan.monthlyTotal > primaryPlan.monthlyTotal 
                    ? `+${formatMoney(comparisonPlan.monthlyTotal - primaryPlan.monthlyTotal)} / mo more expensive` 
                    : `-${formatMoney(primaryPlan.monthlyTotal - comparisonPlan.monthlyTotal)} / mo more affordable`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
