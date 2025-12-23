"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "../apiClient";
import useTranslation from "../hooks/useTranslation";

export default function ProfitCalculation() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfitData();
  }, []);

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/profit");
      // Use backend response directly
      setProfitData({
        totalRevenue: data?.totalRevenue || data?.revenue || 0,
        driverProfit: data?.driverProfit || data?.totalDriverProfit || 0,
        ownerProfit: data?.ownerProfit || data?.totalOwnerProfit || 0,
        platformCommission: data?.platformCommission || data?.totalPlatformCommission || 0,
        commissionRates: data?.commissionRates || null,
      });
    } catch (err) {
      console.error("Failed to fetch profit data:", err);
      setError(err.message);
      setProfitData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t("profit.title")}</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs text-blue-600 font-semibold mb-1">{t("profit.totalRevenue")}</p>
            <p className="text-2xl font-bold text-blue-900">
              SEK {profitData?.totalRevenue?.toLocaleString("sv-SE") || "0"}
            </p>
          </div>
          <div className="rounded-2xl bg-green-50 p-4">
            <p className="text-xs text-green-600 font-semibold mb-1">{t("profit.driverProfit")}</p>
            <p className="text-2xl font-bold text-green-900">
              SEK {profitData?.driverProfit?.toLocaleString("sv-SE") || "0"}
            </p>
          </div>
          <div className="rounded-2xl bg-purple-50 p-4">
            <p className="text-xs text-purple-600 font-semibold mb-1">{t("profit.ownerProfit")}</p>
            <p className="text-2xl font-bold text-purple-900">
              SEK {profitData?.ownerProfit?.toLocaleString("sv-SE") || "0"}
            </p>
          </div>
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-xs text-orange-600 font-semibold mb-1">{t("profit.platformCommission")}</p>
            <p className="text-2xl font-bold text-orange-900">
              SEK {profitData?.platformCommission?.toLocaleString("sv-SE") || "0"}
            </p>
          </div>
        </div>

        {profitData?.commissionRates && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("profit.commissionRates")}</h4>
            <div className="grid gap-3 md:grid-cols-3">
              {profitData.commissionRates.driver !== undefined && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">{t("profit.driverCommission")}</span>
                  <span className="text-lg font-bold text-slate-900">{profitData.commissionRates.driver}%</span>
                </div>
              )}
              {profitData.commissionRates.owner !== undefined && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">{t("profit.ownerCommission")}</span>
                  <span className="text-lg font-bold text-slate-900">{profitData.commissionRates.owner}%</span>
                </div>
              )}
              {profitData.commissionRates.platform !== undefined && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">{t("profit.platformFee")}</span>
                  <span className="text-lg font-bold text-slate-900">{profitData.commissionRates.platform}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

