'use client';

import React, {
  startTransition,
  useEffect,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';

import { Icon, type IconName } from '@/components/icon';
import { Skeleton } from '@/components/skeleton';
import { StatusPill } from '@/components/status-pill';
import { PolicyTable } from '@/components/policy-table';
import { useAppTranslation } from '@/i18n/provider';
import { useOptimisticList } from '@/hooks/use-optimistic-list';

type PolicyStatus = 'active' | 'pending' | 'expired' | 'claimed' | 'all';
type PolicyType =
  | 'weather'
  | 'flight'
  | 'smart-contract'
  | 'asset'
  | 'health'
  | 'all';
type SortBy = 'date' | 'coverage';

interface FilterState {
  statusFilter: PolicyStatus;
  typeFilter: PolicyType;
  sortBy: SortBy;
  minCoverage: number;
  maxCoverage: number;
  startDate: string;
  endDate: string;
}

interface Policy {
  id: string;
  title: string;
  type: PolicyType;
  status: Exclude<PolicyStatus, 'all'>;
  coverageAmount: number;
  premiumAmount: number;
  createdAt: string;
  expiresAt: string;
  oracleSource: string;
}

const MOCK_POLICIES: Policy[] = [
  {
    id: 'weather-alpha',
    title: 'Northern Plains Weather Guard',
    type: 'weather',
    status: 'active',
    coverageAmount: 5000,
    premiumAmount: 125.5,
    createdAt: '2026-02-15',
    expiresAt: '2026-05-15',
    oracleSource: 'NOAA Weather API',
  },
  {
    id: 'flight-orbit',
    title: 'Flight Orbit Delay Cover',
    type: 'flight',
    status: 'active',
    coverageAmount: 2000,
    premiumAmount: 45.0,
    createdAt: '2026-03-01',
    expiresAt: '2026-06-01',
    oracleSource: 'Airline Delay API',
  },
  {
    id: 'smart-contract-alpha',
    title: 'Smart Contract Risk Shield',
    type: 'smart-contract',
    status: 'active',
    coverageAmount: 10000,
    premiumAmount: 250.0,
    createdAt: '2026-01-10',
    expiresAt: '2026-07-10',
    oracleSource: 'Ethereum Audit API',
  },
  {
    id: 'health-basic',
    title: 'Basic Health Coverage',
    type: 'health',
    status: 'pending',
    coverageAmount: 3000,
    premiumAmount: 75.0,
    createdAt: '2026-04-01',
    expiresAt: '2026-10-01',
    oracleSource: 'Health Oracle',
  },
  {
    id: 'asset-protection',
    title: 'Asset Value Protection',
    type: 'asset',
    status: 'expired',
    coverageAmount: 8000,
    premiumAmount: 200.0,
    createdAt: '2025-10-01',
    expiresAt: '2026-01-01',
    oracleSource: 'Price Feed API',
  },
];

const POLICY_TYPE_ICONS: Record<PolicyType, IconName> = {
  weather: 'shield',
  flight: 'clock',
  'smart-contract': 'spark',
  asset: 'wallet',
  health: 'heart',
  all: 'shield',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function PolicyCardContent({
  policy,
  optimisticStatus,
  t,
}: {
  policy: Policy;
  optimisticStatus: 'confirmed' | 'pending' | 'error';
  t: (key: string, opts?: Record<string, string | number>) => string;
}) {
  const typeIcon = POLICY_TYPE_ICONS[policy.type as PolicyType];

  return (
    <article className="policy-card__inner">
      {optimisticStatus === 'pending' && (
        <div className="policy-card__optimistic-badge" aria-live="polite">
          <Icon name="clock" size="sm" tone="warning" aria-hidden="true" />
          <span>{t('policies.card.saving')}</span>
        </div>
      )}
      {optimisticStatus === 'error' && (
        <div
          className="policy-card__optimistic-badge policy-card__optimistic-badge--error"
          aria-live="polite"
        >
          <Icon name="alert" size="sm" tone="danger" aria-hidden="true" />
          <span>{t('policies.card.failedToSave')}</span>
        </div>
      )}
      <div className="policy-card__header">
        <div className="policy-card__title-group">
          <h3>{policy.title}</h3>
          <StatusPill status={policy.status as any} />
        </div>
        <div className="policy-card__icon">
          <Icon name={typeIcon} size="md" tone="accent" />
        </div>
      </div>

      <div className="policy-card__details">
        <div className="policy-card__detail-row">
          <span className="policy-card__label">{t('policies.card.coverage')}</span>
          <span className="policy-card__value">
            {formatCurrency(policy.coverageAmount)}
          </span>
        </div>
        <div className="policy-card__detail-row">
          <span className="policy-card__label">{t('policies.card.premium')}</span>
          <span className="policy-card__value">
            {formatCurrency(policy.premiumAmount)}
          </span>
        </div>
      </div>

      <div className="policy-card__footer">
        <div className="policy-card__meta">
          <span className="policy-card__type-badge">
            <Icon name={typeIcon} size="sm" tone="muted" />
            {t(`policies.typeLabels.${policy.type}`)}
          </span>
          <span className="policy-card__date">
            {formatDate(policy.createdAt)}
          </span>
        </div>
        {optimisticStatus !== 'pending' && (
          <span className="policy-card__cta" aria-hidden="true">
            <Icon name="arrow-up-right" size="sm" tone="accent" />
          </span>
        )}
      </div>
    </article>
  );
}

function PolicyCard({
  policy,
  optimisticStatus = 'confirmed',
  onDismissError,
  t,
}: {
  policy: Policy;
  optimisticStatus?: 'confirmed' | 'pending' | 'error';
  onDismissError?: () => void;
  t: (key: string, opts?: Record<string, string | number>) => string;
}) {
  const isPending = optimisticStatus === 'pending';
  const cardClassName = `policy-card motion-panel${isPending ? ' policy-card--optimistic' : ''}${optimisticStatus === 'error' ? ' policy-card--error' : ''}`;

  return (
    <div
      className={`policy-card-wrapper${isPending ? ' policy-card-wrapper--optimistic' : ''}${optimisticStatus === 'error' ? ' policy-card-wrapper--error' : ''}`}
    >
      {isPending ? (
        <div
          className={cardClassName}
          aria-busy="true"
          aria-disabled="true"
        >
          <PolicyCardContent
            policy={policy}
            optimisticStatus={optimisticStatus}
            t={t}
          />
        </div>
      ) : (
        <Link
          href={`/policies/${policy.id}`}
          className={cardClassName}
          aria-busy={false}
        >
          <PolicyCardContent
            policy={policy}
            optimisticStatus={optimisticStatus}
            t={t}
          />
        </Link>
      )}

      {optimisticStatus === 'error' && onDismissError && (
        <button
          className="policy-card__dismiss-error policy-card__dismiss-error--standalone"
          onClick={(e) => {
            e.preventDefault();
            onDismissError();
          }}
          aria-label={t('policies.card.dismissError', { title: policy.title })}
        >
          <Icon name="close" size="sm" tone="danger" />
        </button>
      )}
    </div>
  );
}

export default function PoliciesListPageClient() {
  const { t } = useAppTranslation();

  const INITIAL_FILTERS = {
    statusFilter: 'all' as PolicyStatus,
    typeFilter: 'all' as PolicyType,
    sortBy: 'date' as SortBy,
    minCoverage: 0,
    maxCoverage: 50000,
    startDate: '',
    endDate: '',
  };

  const [statusFilter, setStatusFilter] = useState<PolicyStatus>(
    INITIAL_FILTERS.statusFilter
  );
  const [typeFilter, setTypeFilter] = useState<PolicyType>(
    INITIAL_FILTERS.typeFilter
  );
  const [sortBy, setSortBy] = useState<SortBy>(INITIAL_FILTERS.sortBy);
  const [minCoverage, setMinCoverage] = useState(INITIAL_FILTERS.minCoverage);
  const [maxCoverage, setMaxCoverage] = useState(INITIAL_FILTERS.maxCoverage);
  const [startDate, setStartDate] = useState(INITIAL_FILTERS.startDate);
  const [endDate, setEndDate] = useState(INITIAL_FILTERS.endDate);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery);

  const {
    items: optimisticPolicies,
    addOptimistic,
    markConfirmed,
    markError,
    dismissError,
  } = useOptimisticList<Policy>(MOCK_POLICIES, {
    idKey: 'id',
    pendingDurationMs: 1200,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [statusFilter, typeFilter, sortBy, minCoverage, maxCoverage]);

  const filteredPolicies = useMemo(() => {
    return optimisticPolicies
      .filter((item) => {
        const policy = item.item;
        const matchesStatus =
          statusFilter === 'all' || policy.status === statusFilter;
        const matchesType = typeFilter === 'all' || policy.type === typeFilter;
        const matchesSearch =
          policy.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          policy.oracleSource.toLowerCase().includes(deferredSearch.toLowerCase());
        // #308 — Normalise reversed min/max so a user-typed `min > max`
        // doesn't silently collapse results to zero. The inline warning
        // beside the filters explains the swap to the user.
        const effectiveMin = Math.min(minCoverage, maxCoverage);
        const effectiveMax = Math.max(minCoverage, maxCoverage);
        const matchesCoverage =
          policy.coverageAmount >= effectiveMin &&
          policy.coverageAmount <= effectiveMax;
        const matchesDate =
          (!startDate || policy.createdAt >= startDate) &&
          (!endDate || policy.createdAt <= endDate);

        return (
          matchesStatus &&
          matchesType &&
          matchesSearch &&
          matchesCoverage &&
          matchesDate
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return (
            new Date(b.item.createdAt).getTime() -
            new Date(a.item.createdAt).getTime()
          );
        }
        return b.item.coverageAmount - a.item.coverageAmount;
      });
  }, [
    optimisticPolicies,
    statusFilter,
    typeFilter,
    deferredSearch,
    minCoverage,
    maxCoverage,
    startDate,
    endDate,
    sortBy,
  ]);

  const totalCoverage = filteredPolicies.reduce(
    (sum, item) => sum + item.item.coverageAmount,
    0
  );
  const activeCount = filteredPolicies.filter(
    (item) => item.item.status === 'active'
  ).length;
  const pendingCount = filteredPolicies.filter(
    (item) => item.optimisticStatus === 'pending'
  ).length;

  const handleFilterChange = (callback: () => void) => {
    setIsLoading(true);
    startTransition(callback);
  };

  const handleSimulateOptimistic = () => {
    const id = `policy-${Date.now()}`;
    const newPolicy: Policy = {
      id,
      title: 'Optimistic Coverage Draft',
      type: 'weather',
      status: 'pending',
      coverageAmount: 1500,
      premiumAmount: 35,
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      oracleSource: 'Demo Oracle',
    };
    addOptimistic(newPolicy);
    setTimeout(() => markConfirmed(id), 1200);
  };

  const handleSimulateError = () => {
    const id = `policy-error-${Date.now()}`;
    const newPolicy: Policy = {
      id,
      title: 'Policy Save Error Example',
      type: 'asset',
      status: 'pending',
      coverageAmount: 2400,
      premiumAmount: 50,
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      oracleSource: 'Demo Oracle',
    };
    addOptimistic(newPolicy);
    setTimeout(() => markError(id), 1200);
  };

  return (
    <div className="policies-page">
      <section className="policies-hero motion-panel">
        <div>
          <p className="eyebrow">{t('policies.hero.eyebrow')}</p>
          <h1>{t('policies.title')}</h1>
          <p>{t('policies.hero.description')}</p>
        </div>
        <div className="policies-hero__actions">
          <button className="btn btn-primary" onClick={handleSimulateOptimistic}>
            {t('policies.simulate.pending')}
          </button>
          <button className="btn btn-secondary" onClick={handleSimulateError}>
            {t('policies.simulate.error')}
          </button>
        </div>
      </section>

      <section className="policies-summary-grid">
        <div className="summary-card motion-panel">
          <span>{t('policies.summary.totalCoverage')}</span>
          <strong>{formatCurrency(totalCoverage)}</strong>
        </div>
        <div className="summary-card motion-panel">
          <span>{t('policies.summary.activePolicies')}</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="summary-card motion-panel">
          <span>{t('policies.summary.pendingChanges')}</span>
          <strong>{pendingCount}</strong>
        </div>
      </section>

      <section className="policies-filters motion-panel">
        <div className="filter-search">
          <Icon name="search" size="sm" tone="muted" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('policies.filters.searchPlaceholder')}
            aria-label={t('policies.filters.searchAriaLabel')}
          />
        </div>

        <label>
          {t('policies.filters.status')}
          <select
            value={statusFilter}
            onChange={(event) =>
              handleFilterChange(() =>
                setStatusFilter(event.target.value as PolicyStatus)
              )
            }
          >
            <option value="all">{t('policies.filters.statusOptions.all')}</option>
            <option value="active">{t('policies.filters.statusOptions.active')}</option>
            <option value="pending">{t('policies.filters.statusOptions.pending')}</option>
            <option value="expired">{t('policies.filters.statusOptions.expired')}</option>
            <option value="claimed">{t('policies.filters.statusOptions.claimed')}</option>
          </select>
        </label>

        <label>
          {t('policies.filters.type')}
          <select
            value={typeFilter}
            onChange={(event) =>
              handleFilterChange(() => setTypeFilter(event.target.value as PolicyType))
            }
          >
            <option value="all">{t('policies.filters.typeOptions.all')}</option>
            <option value="weather">{t('policies.filters.typeOptions.weather')}</option>
            <option value="flight">{t('policies.filters.typeOptions.flight')}</option>
            <option value="smart-contract">{t('policies.filters.typeOptions.smart-contract')}</option>
            <option value="asset">{t('policies.filters.typeOptions.asset')}</option>
            <option value="health">{t('policies.filters.typeOptions.health')}</option>
          </select>
        </label>

        <label>
          {t('policies.filters.sortLabel')}
          <select
            value={sortBy}
            onChange={(event) =>
              handleFilterChange(() => setSortBy(event.target.value as SortBy))
            }
          >
            <option value="date">{t('policies.filters.sortOptions.date')}</option>
            <option value="coverage">{t('policies.filters.sortOptions.coverage')}</option>
          </select>
        </label>

        {/* #308 — Coverage min/max filters with reversed-range guard.
            Invalid combinations are explained inline, announced via the
            live region below, and *not* silently applied (the effective
            range is swapped so results don't collapse to zero). */}
        <label>
          {t('policies.filters.minCoverageLabel')}
          <input
            type="number"
            min={0}
            value={minCoverage}
            onChange={(event) =>
              handleFilterChange(() =>
                setMinCoverage(Number(event.target.value) || 0),
              )
            }
            aria-invalid={minCoverage > maxCoverage}
            aria-describedby="coverage-range-warning"
          />
        </label>
        <label>
          {t('policies.filters.maxCoverageLabel')}
          <input
            type="number"
            min={0}
            value={maxCoverage}
            onChange={(event) =>
              handleFilterChange(() =>
                setMaxCoverage(Number(event.target.value) || 0),
              )
            }
            aria-invalid={minCoverage > maxCoverage}
            aria-describedby="coverage-range-warning"
          />
        </label>
        <p
          id="coverage-range-warning"
          className="policies-filters__warning"
          role="status"
          aria-live="polite"
        >
          {minCoverage > maxCoverage
            ? t('policies.filters.coverageWarning', {
                min: minCoverage.toLocaleString(),
                max: maxCoverage.toLocaleString(),
              })
            : ''}
        </p>

        <div className="view-toggle" role="group" aria-label={t('policies.filters.viewMode')}>
          <button
            className={viewMode === 'grid' ? 'is-active' : ''}
            onClick={() => setViewMode('grid')}
          >
            {t('policies.filters.grid')}
          </button>
          <button
            className={viewMode === 'list' ? 'is-active' : ''}
            onClick={() => setViewMode('list')}
          >
            {t('policies.filters.list')}
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="policies-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="policy-card policy-card--skeleton" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="policies-grid">
          {filteredPolicies.map((item) => (
            <PolicyCard
              key={item.item.id}
              policy={item.item}
              optimisticStatus={item.optimisticStatus}
              onDismissError={() => dismissError(item.item.id)}
              t={t}
            />
          ))}
        </div>
      ) : (
        <PolicyTable policies={filteredPolicies.map((item) => item.item)} />
      )}
    </div>
  );
}
