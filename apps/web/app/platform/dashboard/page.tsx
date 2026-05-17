export default function PlatformDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">平台仪表盘</h1>
        <p className="text-slate-600 mt-1">欢迎回到平台管理系统</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总店铺数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>
            <div className="text-3xl">🏪</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">活跃店铺</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总会员数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总订单数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">快速操作</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/platform/shops"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-slate-900">新增店铺</span>
          </a>
          <a
            href="/platform/admins"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">👤</span>
            <span className="font-medium text-slate-900">管理管理员</span>
          </a>
          <a
            href="/platform/settings"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <span className="font-medium text-slate-900">系统设置</span>
          </a>
        </div>
      </div>
    </div>
  );
}