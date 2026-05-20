'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, Download, ArrowLeft, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import {
  importMembers,
  previewImport,
  downloadTemplate,
  type ImportSummary,
  type PreviewResult,
} from '../../../../lib/api/import';

type Step = 'upload' | 'preview' | 'result';

export default function MemberImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await previewImport(file, 'members');
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await importMembers(file);
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/members"
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">导入会员</h1>
          <p className="text-sm text-muted-foreground mt-1">
            支持从 Excel (.xlsx) 或 CSV 文件批量导入会员数据
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[
          { key: 'upload', label: '1. 上传文件' },
          { key: 'preview', label: '2. 预览确认' },
          { key: 'result', label: '3. 导入结果' },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                step === s.key
                  ? 'bg-primary text-primary-foreground'
                  : s.key === 'upload' || (s.key === 'preview' && step === 'result')
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => downloadTemplate('members')}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            下载导入模板
          </button>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">点击或拖拽上传文件</p>
                <p className="text-sm text-muted-foreground mt-1">
                  支持 .xlsx 和 .csv 格式，最大 10MB
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? '解析中...' : '预览数据'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">总行数</span>
              <span className="font-medium">{preview.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              以下显示前 10 行数据预览
            </p>
          </div>

          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">#</th>
                  {preview.columns.map((col) => (
                    <th key={col} className="text-left p-3 font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    {preview.columns.map((col) => (
                      <td key={col} className="p-3 whitespace-nowrap">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setError('');
              }}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              返回上传
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {loading ? '导入中...' : `确认导入 (${preview.total} 条)`}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{result.total}</div>
              <div className="text-sm text-muted-foreground mt-1">总计</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">{result.succeeded}</div>
              <div className="text-sm text-muted-foreground mt-1">成功</div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <XCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
              <div className="text-2xl font-bold text-destructive">{result.failed}</div>
              <div className="text-sm text-muted-foreground mt-1">失败</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-card border rounded-lg overflow-x-auto">
              <div className="p-3 border-b font-medium text-sm">错误详情</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">行号</th>
                    <th className="text-left p-3 font-medium">错误原因</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="p-3 text-muted-foreground">第 {err.row} 行</td>
                      <td className="p-3 text-destructive">{err.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              继续导入
            </button>
            <Link
              href="/admin/members"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              返回会员列表
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
