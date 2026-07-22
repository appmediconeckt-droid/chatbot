import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../../../axiosConfig";
import "./CounselorEarnings.css";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CounselorEarnings = () => {
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
    try {
      setSubmitting(true);
      const response = await axiosInstance.post("/api/wallet/withdraw", {
        ...withdrawalForm,
        amount: Number(withdrawalForm.amount),
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
    return <div className="rounded-2xl bg-white p-10 text-center text-slate-500">Loading earnings...</div>;
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

  return (
    <div className="ml-2 mt-3 space-y-6 p-1 sm:ml-3 sm:mt-4 lg:ml-5 lg:mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings & payouts</h1>
          <p className="mt-1 text-sm text-slate-500">Live earning data from completed paid chat, voice and video sessions.</p>
        </div>
        <button
          type="button"
          onClick={() => { setNotice(""); setShowWithdrawal((value) => !value); }}
          disabled={Number(data?.balance || 0) <= 0}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Withdraw funds
        </button>
      </div>

      <form onSubmit={applyDateFilter} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mr-auto">
          <h2 className="text-sm font-bold text-slate-900">Filter by date</h2>
          <p className="mt-1 text-xs text-slate-500">View complete earnings and withdrawals for any selected period.</p>
        </div>
        <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold text-slate-600">
          From date
          <input
            type="date"
            value={dateInputs.from}
            max={dateInputs.to || undefined}
            onChange={(event) => setDateInputs((current) => ({ ...current, from: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold text-slate-600">
          To date
          <input
            type="date"
            value={dateInputs.to}
            min={dateInputs.from || undefined}
            onChange={(event) => setDateInputs((current) => ({ ...current, to: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-indigo-500"
          />
        </label>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">Apply</button>
        {(dateFilter.from || dateFilter.to) && (
          <button type="button" onClick={clearDateFilter} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Clear</button>
        )}
        {data?.period?.filtered && (
          <p className="w-full text-xs font-semibold text-indigo-700">
            Showing {data.period.earningCount} earning records and {data.period.withdrawalCount} withdrawals
            {data.period.from ? ` from ${new Date(`${data.period.from}T00:00:00`).toLocaleDateString("en-IN")}` : ""}
            {data.period.to ? ` to ${new Date(`${data.period.to}T00:00:00`).toLocaleDateString("en-IN")}` : ""}.
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
        <form onSubmit={submitWithdrawal} className="withdrawal-card">
          <div className="withdrawal-card-header">
            <div className="withdrawal-card-heading">
              <span className="withdrawal-card-icon" aria-hidden="true">₹</span>
              <div>
                <span className="withdrawal-card-eyebrow">Secure payout</span>
                <h2>Withdraw your earnings</h2>
                <p>Funds will be transferred to the bank account entered below.</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowWithdrawal(false)} className="withdrawal-close" aria-label="Close withdrawal form" title="Close">
              <FaTimes aria-hidden="true" />
            </button>
          </div>

          <div className="withdrawal-balance">
            <span>Available balance</span>
            <strong>{money(data?.balance)}</strong>
            <small>You can request up to your available balance.</small>
          </div>

          <div className="withdrawal-section-title">
            <span>1</span>
            <div><strong>Withdrawal amount</strong><small>Enter the amount you want to withdraw</small></div>
          </div>

          <label className="withdrawal-field withdrawal-amount-field">
            <span className="withdrawal-label">Amount</span>
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
            <div><strong>Choose payout speed</strong><small>Select when you want the money in your bank</small></div>
          </div>
          <div className="payout-speed-options">
            <button
              type="button"
              className={`payout-speed-option ${withdrawalForm.payoutType === "standard" ? "selected" : ""}`}
              onClick={() => setWithdrawalForm((current) => ({ ...current, payoutType: "standard" }))}
            >
              <span className="payout-speed-radio" />
              <span><strong>Standard payout</strong><small>Free · Within {standardOption.etaDays || 3} business days</small></span>
              <b>FREE</b>
            </button>
            <button
              type="button"
              className={`payout-speed-option instant ${withdrawalForm.payoutType === "instant" ? "selected" : ""}`}
              onClick={() => setWithdrawalForm((current) => ({ ...current, payoutType: "instant" }))}
            >
              <span className="payout-speed-radio" />
              <span>
                <strong>Instant payout</strong>
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
              <div><span>You will receive</span><strong>{money(estimatedPayout)}</strong></div>
            </div>
          )}

          {verifiedPayoutAccount ? (
            <>
              <div className="withdrawal-section-title withdrawal-bank-title">
                <span>3</span>
                <div><strong>Verified payout account</strong><small>Your withdrawal will be sent to this saved account</small></div>
              </div>
              <div className="verified-payout-account">
                <span className="verified-payout-icon">✓</span>
                <div>
                  <strong>{verifiedPayoutAccount.bankName}</strong>
                  <p>{verifiedPayoutAccount.accountName} · Account ending in {verifiedPayoutAccount.last4}</p>
                  <small>IFSC: {verifiedPayoutAccount.ifsc}</small>
                </div>
                <span className="verified-payout-badge">Verified</span>
              </div>
            </>
          ) : (
            <>
              <div className="withdrawal-section-title withdrawal-bank-title">
                <span>3</span>
                <div><strong>Verify bank account</strong><small>Required only for your first withdrawal</small></div>
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
            <button type="button" onClick={() => setShowWithdrawal(false)} className="withdrawal-cancel">Cancel</button>
            <button type="submit" disabled={submitting} className="withdrawal-submit">
              {submitting ? "Submitting request..." : withdrawalForm.payoutType === "instant" ? "Withdraw instantly" : "Request withdrawal"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Available balance", data?.balance, "Ready for withdrawal"],
          [data?.period?.filtered ? "Earned in selected period" : "Total earned", data?.totalEarned, `${counselorPercentage}% counselor share`],
          ["Available for payout", data?.pendingPayout, "Earned, but not withdrawn yet"],
          [data?.period?.filtered ? "Period gross session value" : "Gross session value", data?.grossRevenue, `Platform received ${money(data?.platformCommission)}`],
        ].map(([label, value, caption]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{money(value)}</p>
            <p className="mt-1 text-xs text-slate-500">{caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Counselor share</p>
          <div className="mt-2">
            <strong className="text-3xl text-indigo-950">{counselorPercentage}%</strong>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full bg-indigo-600" style={{ width: `${counselorPercentage}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Platform commission</p>
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
          <h2 className="font-bold text-slate-900">Earning history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-4 py-3">User / session</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Platform ({platformPercentage}%)</th>
                <th className="px-4 py-3 text-right">Your earning ({counselorPercentage}%)</th>
                <th className="px-4 py-3">Earning status</th>
                <th className="px-5 py-3">Payout</th>
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
                <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-500">No paid session earnings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Withdrawal requests</h2>
          <p className="mt-1 text-xs text-slate-500">Approved means the payout is being processed. Paid appears after the bank transfer is completed.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3">Date</th><th className="px-4 py-3">Bank</th><th className="px-4 py-3">Payout type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-5 py-3">Status</th></tr>
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
              )) : <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500">No withdrawal requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CounselorEarnings;
