'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createMember } from '@/lib/api/members';

const GENDER_OPTIONS = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'OTHER', label: '其他' },
];

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: 'MALE',
    birthday: '',
    remark: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      alert('请填写姓名和手机号');
      return;
    }

    setLoading(true);
    try {
      await createMember({
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        birthday: form.birthday || undefined,
        remark: form.remark.trim() || undefined,
      });
      alert('创建成功');
      router.push('/m/members');
    } catch (error: unknown) {
      alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 z-40">
        <div className="flex items-center px-4 py-3">
          <Link
            href="/m/members"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 ml-3 text-lg font-bold text-slate-900 dark:text-white">新建会员</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="请输入姓名"
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            手机号 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="请输入手机号"
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            性别
          </label>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, gender: opt.value })}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  form.gender === opt.value
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            生日
          </label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Remark */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            备注
          </label>
          <textarea
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            placeholder="选填备注"
            rows={2}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.name.trim() || !form.phone.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[48px]"
        >
          {loading ? '创建中...' : '创建会员'}
        </button>
      </form>
    </div>
  );
}
