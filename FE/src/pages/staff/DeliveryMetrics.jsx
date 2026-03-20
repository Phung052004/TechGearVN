import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { orderService } from "../../services";

export default function DeliveryMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const data = await orderService.getDeliveryMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Lỗi tải metrics", err);
      toast.error("Không thể tải metrics giao hàng");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Đang tải...</div>;
  }

  if (!metrics) {
    return <div className="text-gray-600">Không có dữ liệu</div>;
  }

  const { totals, failureReasons, byPerson } = metrics;

  return (
    <div className="space-y-4">
      {/* Overall Metrics */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="text-lg font-extrabold text-gray-900 mb-4">
          Thống kê giao hàng tổng thể
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="text-xs text-blue-700 font-bold">Người giao</div>
            <div className="text-2xl font-extrabold text-blue-900">
              {totals.deliveryPersonCount}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
            <div className="text-xs text-purple-700 font-bold">
              Đơn hoàn tất
            </div>
            <div className="text-2xl font-extrabold text-purple-900">
              {totals.totalAssigned}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
            <div className="text-xs text-emerald-700 font-bold">
              Giao thành công
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">
              {totals.totalCompleted}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
            <div className="text-xs text-orange-700 font-bold">
              Giao thất bại
            </div>
            <div className="text-2xl font-extrabold text-orange-900">
              {totals.totalFailed}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3">
            <div className="text-xs text-indigo-700 font-bold">
              Tỷ lệ thành công
            </div>
            <div className="text-2xl font-extrabold text-indigo-900">
              {totals.overallSuccessRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Failure Reasons */}
      {Object.keys(failureReasons).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-lg font-extrabold text-gray-900 mb-4">
            Lý do giao hàng thất bại
          </div>

          <div className="space-y-2">
            {Object.entries(failureReasons)
              .sort(([, a], [, b]) => b - a)
              .map(([reason, count]) => (
                <div
                  key={reason}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-sm text-gray-900">{reason}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {count}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({Math.round((count / totals.totalFailed) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Per-Person Metrics */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="text-lg font-extrabold text-gray-900 mb-4">
          Thống kê theo người giao hàng
        </div>

        <div className="space-y-3">
          {byPerson.map((person) => (
            <div
              key={person._id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">
                    {person.fullName}
                  </div>
                  <div className="text-xs text-gray-600">{person.email}</div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">
                      Tỷ lệ thành công
                    </div>
                    <div className="text-lg font-extrabold text-gray-900">
                      {person.successRate}%
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600">Thành công</div>
                    <div className="text-lg font-extrabold text-emerald-600">
                      {person.completedCount}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600">Thất bại</div>
                    <div className="text-lg font-extrabold text-orange-600">
                      {person.failureCount}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600">Hoàn tất</div>
                    <div className="text-lg font-extrabold text-blue-600">
                      {person.assignedCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 flex gap-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500"
                  style={{
                    width: `${
                      person.assignedCount > 0
                        ? (person.completedCount / person.assignedCount) * 100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-orange-500"
                  style={{
                    width: `${
                      person.assignedCount > 0
                        ? (person.failureCount / person.assignedCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
