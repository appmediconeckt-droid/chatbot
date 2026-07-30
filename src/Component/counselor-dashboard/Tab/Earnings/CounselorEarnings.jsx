import React, { useEffect, useState } from "react";
import { FaArrowRight, FaCalendarAlt, FaCheckCircle, FaComments, FaFilter, FaPhoneAlt, FaTimes, FaUndo, FaVideo, FaWallet } from "react-icons/fa";
import axiosInstance from "../../../../axiosConfig";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import "./CounselorEarnings.css";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const CounselorEarnings = () => {
  const { t } = useCounselorTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [dateInputs, setDateInputs] = useState({ from: "", to: "" });
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    payoutType: "standard",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });

  const loadEarnings = async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const params = {};
        if (dateFilter.from) params.from = dateFilter.from;
        if (dateFilter.to) params.to = dateFilter.to;
        const response = await axiosInstance.get("/api/wallet/counselor", { params });
        setData(response.data);
        const account = response.data?.payoutAccount || {};
        setWithdrawalForm((current) => ({
          ...current,
          accountName: current.accountName || account.accountName || "",
          accountNumber: current.accountNumber || account.accountNumber || "",
          ifsc: current.ifsc || account.ifsc || "",
          bankName: current.bankName || account.bankName || "",
        }));
        setError("");
      } catch (requestError) {
        console.error("Counselor earnings load failed:", requestError);
        setError(requestError.response?.data?.message || "Earnings could not be loaded.");
      } finally {
        if (!silent) setLoading(false);
      }
  };

  useEffect(() => {
    void loadEarnings();
    const refreshTimer = window.setInterval(() => {
      void loadEarnings({ silent: true });
    }, 15_000);
    const refreshOnFocus = () => void loadEarnings({ silent: true });
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [dateFilter.from, dateFilter.to]);

  useEffect(() => {
    if (!showWithdrawal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !submitting) setShowWithdrawal(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showWithdrawal, submitting]);

  const applyDateFilter = (event) => {
    event.preventDefault();
    if (dateInputs.from && dateInputs.to && dateInputs.from > dateInputs.to) {
      setError("From date cannot be after To date.");
      return;
    }
    setError("");
    setDateFilter(dateInputs);
  };

  const clearDateFilter = () => {
    const empty = { from: "", to: "" };
    setDateInputs(empty);
    setDateFilter(empty);
    setError("");
  };

  const withdrawalStatusClass = (status) => {
    if (status === "paid") return "bg-emerald-50 text-emerald-700";
    if (status === "approved") return "bg-sky-50 text-sky-700";
    if (status === "rejected" || status === "refunded") return "bg-rose-50 text-rose-700";
    return "bg-amber-50 text-amber-700";
  };

  const submitWithdrawal = async (event) => {
    event.preventDefault();
    setNotice("");
    const amount = Number(withdrawalForm.amount);
    const availableBalance = Number(data?.balance || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("Please enter a valid withdrawal amount.");
      return;
    }
    if (amount > availableBalance) {
      setNotice("Withdrawal amount cannot exceed your available balance.");
      return;
    }
    try {
      setSubmitting(true);
      const response = await axiosInstance.post("/api/wallet/withdraw", {
        ...withdrawalForm,
        amount,
      });
      setNotice(response.data?.message || "Withdrawal request submitted successfully.");
      setWithdrawalForm((current) => ({ ...current, amount: "" }));
      setShowWithdrawal(false);
      await loadEarnings();
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || "Withdrawal request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl bg-white p-10 text-center text-slate-500">{t("loading_earnings")}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;
  }

  const earnings = data?.earnings || [];
  const verifiedPayoutAccount = data?.payoutAccount?.isVerified ? data.payoutAccount : null;
  const counselorPercentage = data?.split?.counselorPercentage ?? 80;
  const platformPercentage = data?.split?.platformPercentage ?? 20;
  const instantOption = data?.payoutOptions?.instant || {};
  const standardOption = data?.payoutOptions?.standard || {};
  const requestedAmount = Number(withdrawalForm.amount || 0);
  const selectedFeePercent = withdrawalForm.payoutType === "instant" ? Number(instantOption.feePercent || 0) : 0;
  const estimatedFee = Math.round((requestedAmount * selectedFeePercent + Number.EPSILON) * 100) / 100;
  const estimatedPayout = Math.max(0, requestedAmount - estimatedFee);
  const availableBalance = Number(data?.balance || 0);
  const canSubmitWithdrawal =
    requestedAmount > 0 &&
    requestedAmount <= availableBalance &&
    !submitting;

  return (
    <div className="counselor-earnings-page ml-2 mt-3 space-y-6 p-1 sm:ml-3 sm:mt-4 lg:ml-5 lg:mt-5">
      <header className="earnings-page-title">
        <h1>{t("earnings_overview")}</h1>
      </header>

      <div className="earnings-overview-layout">
        <div className="earnings-overview-main">
          <section className="earnings-balance-card">
            <div className="earnings-balance-label"><FaWallet /> {t("total_earning")}</div>
            <div className="earnings-growth">↗ +12.5%</div>
            <strong>{money(data?.totalEarned)}</strong>
            <p>Across {earnings.length} completed sessions this month</p>
            <div className="earnings-balance-footer">
              <div><span>{t("pending")}</span><b>{money(data?.pendingPayout)}</b></div>
              <div><span>{t("withdrawable")}</span><b>{money(data?.balance)}</b></div>
              <button
                type="button"
                onClick={() => {
                  setNotice("");
                  setShowWithdrawal(true);
                }}
                aria-haspopup="dialog"
              >
                <FaArrowRight /> Withdraw
              </button>
            </div>
          </section>

          <div className="earnings-summary-grid">
            <article><span><FaCheckCircle /> {t("last_30_days")}</span><strong>{money(data?.totalEarned)}</strong></article>
            <article><span><FaCheckCircle /> {t("last_30_days")}</span><strong>{money(data?.balance)}</strong></article>
            <article><span>{t("pending_payout")}</span><strong>{money(data?.pendingPayout)}</strong><small>◷ {t("awaiting_processing")}</small></article>
            <article><span>{t("this_month")}</span><strong>{money(data?.totalEarned)}</strong><small>{earnings.length} {t("sessions_completed")}</small></article>
          </div>
        </div>

        <aside className="earnings-recent-panel">
          <div className="earnings-recent-header"><h2>{t("recent_transactions")}</h2><span>{t("view_all")}</span></div>
          <div className="earnings-recent-list">
            {earnings.slice(0, 5).map((earning) => {
              const type = String(earning.sessionType || "chat").toLowerCase();
              const Icon = type === "video" ? FaVideo : type === "voice" || type === "audio" ? FaPhoneAlt : FaComments;
              return (
                <div className="earnings-recent-item" key={earning._id}>
                  <i><Icon /></i>
                  <div>
                    <strong>{earning.userId?.anonymous || "Anonymous User"}</strong>
                    <span>{type} session •</span>
                    <small>{new Date(earning.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>
                  </div>
                  <b>+ {money(earning.earningAmount)}</b>
                </div>
              );
            })}
            {!earnings.length && <p className="earnings-recent-empty">{t("no_transactions_yet")}</p>}
          </div>
        </aside>
      </div>

      <form onSubmit={applyDateFilter} className="earnings-date-filter-card">
        <div className="earnings-date-filter-heading">
          <span className="earnings-date-filter-icon" aria-hidden="true"><FaCalendarAlt /></span>
          <div>
            <h2>{t("filter_by_date")}</h2>
            <p>{t("earnings_filter_description")}</p>
          </div>
        </div>

        <div className="earnings-date-filter-controls">
        <label className="earnings-date-field">
          <span>From date</span>
          <input
            type="date"
            value={dateInputs.from}
            max={dateInputs.to || undefined}
            onChange={(event) => setDateInputs((current) => ({ ...current, from: event.target.value }))}
            className="earnings-date-input"
          />
        </label>
        <span className="earnings-date-separator" aria-hidden="true">→</span>
        <label className="earnings-date-field">
          <span>To date</span>
          <input
            type="date"
            value={dateInputs.to}
            min={dateInputs.from || undefined}
            onChange={(event) => setDateInputs((current) => ({ ...current, to: event.target.value }))}
            className="earnings-date-input"
          />
        </label>
        <button type="submit" className="earnings-primary-button earnings-filter-action">
          <FaFilter aria-hidden="true" /> {t("apply")}
        </button>
        {(dateFilter.from || dateFilter.to) && (
          <button type="button" onClick={clearDateFilter} className="earnings-filter-clear">
            <FaUndo aria-hidden="true" /> {t("clear")}
          </button>
        )}
        </div>
        {data?.period?.filtered && (
          <p className="earnings-filter-summary">
            <FaCheckCircle aria-hidden="true" />
            <span>
            Showing {data.period.earningCount} earning records and {data.period.withdrawalCount} withdrawals
            {data.period.from ? ` from ${new Date(`${data.period.from}T00:00:00`).toLocaleDateString("en-IN")}` : ""}
            {data.period.to ? ` to ${new Date(`${data.period.to}T00:00:00`).toLocaleDateString("en-IN")}` : ""}.
            </span>
          </p>
        )}
      </form>

      {notice && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          notice.toLowerCase().includes("submitted")
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-rose-200 bg-rose-50 text-rose-700"
        }`}>{notice}</div>
      )}

      {showWithdrawal && (
        <div
          className="withdrawal-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setShowWithdrawal(false);
          }}
        >
        <form
          onSubmit={submitWithdrawal}
          className="withdrawal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdrawal-dialog-title"
        >
          <div className="withdrawal-card-header">
            <div className="withdrawal-card-heading">
              <span className="withdrawal-card-icon" aria-hidden="true">₹</span>
              <div>
                <span className="withdrawal-card-eyebrow">{t("secure_payout")}</span>
                <h2 id="withdrawal-dialog-title">{t("withdraw_your_earnings")}</h2>
                <p>{t("withdrawal_transfer_description")}</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowWithdrawal(false)} className="withdrawal-close" aria-label="Close withdrawal form" title="Close">
              <FaTimes aria-hidden="true" />
            </button>
          </div>

          <div className="withdrawal-balance">
            <span>{t("available_balance")}</span>
            <strong>{money(data?.balance)}</strong>
            <small>{t("withdrawal_balance_hint")}</small>
          </div>

          {availableBalance <= 0 && (
            <div className="withdrawal-zero-balance" role="status">
              Your withdrawal form is ready, but there is currently no withdrawable balance. Completed and cleared session earnings will appear here automatically.
            </div>
          )}

          {notice && (
            <div className="withdrawal-form-notice" role="alert">{notice}</div>
          )}

          <div className="withdrawal-section-title">
            <span>1</span>
            <div><strong>{t("withdrawal_amount")}</strong><small>{t("enter_withdrawal_amount")}</small></div>
          </div>

          <label className="withdrawal-field withdrawal-amount-field">
            <span className="withdrawal-label">{t("amount")}</span>
            <div className="withdrawal-amount-input">
              <b>₹</b>
              <input
                required
                type="number"
                min="1"
                max={Number(data?.balance || 0)}
                step="0.01"
                placeholder="0.00"
                value={withdrawalForm.amount}
                onChange={(event) => setWithdrawalForm((current) => ({ ...current, amount: event.target.value }))}
              />
              <button type="button" onClick={() => setWithdrawalForm((current) => ({ ...current, amount: String(data?.balance || "") }))}>MAX</button>
            </div>
          </label>

          <div className="withdrawal-section-title">
            <span>2</span>
            <div><strong>{t("choose_payout_speed")}</strong><small>{t("payout_speed_hint")}</small></div>
          </div>
          <div className="payout-speed-options">
            <button
              type="button"
              className={`payout-speed-option ${withdrawalForm.payoutType === "standard" ? "selected" : ""}`}
              onClick={() => setWithdrawalForm((current) => ({ ...current, payoutType: "standard" }))}
            >
              <span className="payout-speed-radio" />
              <span><strong>{t("standard_payout")}</strong><small>{t("free")} · {t("within")} {standardOption.etaDays || 3} {t("business_days")}</small></span>
              <b>{t("free")}</b>
            </button>
            <button
              type="button"
              className={`payout-speed-option instant ${withdrawalForm.payoutType === "instant" ? "selected" : ""}`}
              onClick={() => setWithdrawalForm((current) => ({ ...current, payoutType: "instant" }))}
            >
              <span className="payout-speed-radio" />
              <span>
                <strong>{t("instant_payout")}</strong>
                <small>Money arrives within {instantOption.etaMinutes || 30} minutes</small>
              </span>
              <b>{instantOption.isFirstFree ? "FIRST ONE FREE" : `${instantOption.feePercent || 0}% FEE`}</b>
            </button>
          </div>

          {withdrawalForm.payoutType === "instant" && (
            <div className="instant-payout-summary">
              {instantOption.isFirstFree ? (
                <p><strong>Your first instant payout is free.</strong> No instant transfer fee will be deducted this time.</p>
              ) : (
                <p>Instant payout fee ({selectedFeePercent}%): <strong>-{money(estimatedFee)}</strong></p>
              )}
              <div><span>{t("you_will_receive")}</span><strong>{money(estimatedPayout)}</strong></div>
            </div>
          )}

          {verifiedPayoutAccount ? (
            <>
              <div className="withdrawal-section-title withdrawal-bank-title">
                <span>3</span>
                <div><strong>{t("verified_payout_account")}</strong><small>{t("verified_payout_hint")}</small></div>
              </div>
              <div className="verified-payout-account">
                <span className="verified-payout-icon">✓</span>
                <div>
                  <strong>{verifiedPayoutAccount.bankName}</strong>
                  <p>{verifiedPayoutAccount.accountName} · Account ending in {verifiedPayoutAccount.last4}</p>
                  <small>IFSC: {verifiedPayoutAccount.ifsc}</small>
                </div>
                <span className="verified-payout-badge">{t("verified")}</span>
              </div>
            </>
          ) : (
            <>
              <div className="withdrawal-section-title withdrawal-bank-title">
                <span>3</span>
                <div><strong>{t("verify_bank_account")}</strong><small>{t("first_withdrawal_requirement")}</small></div>
              </div>
              <div className="withdrawal-fields-grid">
                {[
                  ["accountName", "Account holder name", "Name as shown on bank account"],
                  ["accountNumber", "Account number", "Enter account number"],
                  ["ifsc", "IFSC code", "Example: SBIN0001234"],
                  ["bankName", "Bank name", "Enter bank name"],
                ].map(([name, label, placeholder]) => (
                  <label key={name} className="withdrawal-field">
                    <span className="withdrawal-label">{label}</span>
                    <input
                      required
                      type="text"
                      placeholder={placeholder}
                      value={withdrawalForm[name]}
                      onChange={(event) => setWithdrawalForm((current) => ({
                        ...current,
                        [name]: name === "ifsc" ? event.target.value.toUpperCase() : event.target.value,
                      }))}
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="withdrawal-security-note">
            <span aria-hidden="true">🔒</span>
            <p>
              <strong>{verifiedPayoutAccount ? "Verified payout account." : "Your bank details are protected."}</strong>{" "}
              {verifiedPayoutAccount
                ? `Funds will be sent to the account ending in ${verifiedPayoutAccount.last4}.`
                : "After the first withdrawal, this account is saved and next time only the amount is required."}
            </p>
          </div>

          <div className="withdrawal-actions">
            <button type="button" onClick={() => setShowWithdrawal(false)} className="withdrawal-cancel">{t("common.cancel")}</button>
            <button type="submit" disabled={!canSubmitWithdrawal} className="withdrawal-submit">
              {submitting ? "Submitting request..." : withdrawalForm.payoutType === "instant" ? "Withdraw instantly" : "Request withdrawal"}
            </button>
          </div>
        </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{t("counselor_share")}</p>
          <div className="mt-2">
            <strong className="text-3xl text-indigo-950">{counselorPercentage}%</strong>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full bg-indigo-600" style={{ width: `${counselorPercentage}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{t("platform_commission")}</p>
          <div className="mt-2">
            <strong className="text-3xl text-amber-950">{platformPercentage}%</strong>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full bg-amber-500" style={{ width: `${platformPercentage}%` }} />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">{t("earning_history")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("user_session")}</th>
                <th className="px-4 py-3 text-right">{t("gross")}</th>
                <th className="px-4 py-3 text-right">Platform ({platformPercentage}%)</th>
                <th className="px-4 py-3 text-right">Your earning ({counselorPercentage}%)</th>
                <th className="px-4 py-3">{t("earning_status")}</th>
                <th className="px-5 py-3">{t("payout")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earnings.length ? earnings.map((earning) => (
                <tr key={earning._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-slate-600">{new Date(earning.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold capitalize text-slate-900">{earning.userId?.anonymous || "Anonymous User"}</p>
                    <p className="text-xs capitalize text-slate-500">{earning.sessionType} session</p>
                  </td>
                  <td className="px-4 py-4 text-right font-medium">{money(earning.totalAmount)}</td>
                  <td className="px-4 py-4 text-right font-medium text-amber-700">-{money(earning.commission)}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-700">+{money(earning.earningAmount)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">
                      {earning.earningStatus || "completed"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                      earning.payoutStatus === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {earning.payoutStatus === "pending" ? "Available" : earning.payoutStatus}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-500">{t("no_paid_earnings")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">{t("withdrawal_requests")}</h2>
          <p className="mt-1 text-xs text-slate-500">Approved means the payout is being processed. Paid appears after the bank transfer is completed.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3">{t("date")}</th><th className="px-4 py-3">{t("bank")}</th><th className="px-4 py-3">{t("payout_type")}</th><th className="px-4 py-3 text-right">{t("amount")}</th><th className="px-5 py-3">{t("status")}</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.withdrawals?.length ? data.withdrawals.map((item) => (
                <tr key={item._id}>
                  <td className="px-5 py-4 text-slate-600">{new Date(item.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{item.metadata?.bankName || "Bank account"}</p>
                    <p className="text-xs text-slate-500">•••• {String(item.metadata?.accountNumber || "").slice(-4)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold capitalize text-slate-800">{item.metadata?.payoutType || "standard"}</p>
                    <p className="text-xs text-slate-500">{item.metadata?.estimatedArrival || "Standard processing"}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="font-bold text-slate-900">{money(item.metadata?.netAmount ?? item.amount)}</p>
                    {Number(item.metadata?.feeAmount || 0) > 0 && <p className="text-xs text-rose-600">Fee {money(item.metadata.feeAmount)}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${withdrawalStatusClass(item.status)}`}>{item.status}</span>
                    {item.status === "approved" && <p className="mt-1 text-[10px] text-sky-700">Payment processing</p>}
                    {item.status === "paid" && (
                      <div className="mt-1 text-[10px] text-emerald-700">
                        <p>Sent to bank{item.metadata?.paidAt ? ` on ${new Date(item.metadata.paidAt).toLocaleDateString("en-IN")}` : ""}</p>
                        {item.metadata?.transactionReference && <p className="font-semibold">UTR: {item.metadata.transactionReference}</p>}
                      </div>
                    )}
                    {item.status === "rejected" && item.metadata?.failureReason && (
                      <p className="mt-1 text-[10px] text-rose-700">{item.metadata.failureReason} · Amount returned to wallet</p>
                    )}
                  </td>
                </tr>
              )) : <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500">{t("no_withdrawal_requests")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CounselorEarnings;