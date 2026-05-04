"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen, Download, LogOut, ArrowLeft,
  Loader2, FileText, Image as ImageIcon, File, X,
  Search, ChevronRight, Home
} from "lucide-react";
import clsx from "clsx";

interface PodFolder {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { files: number; children: number };
}

interface PodFile {
  id: string;
  filename: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(s: string): string {
  try { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
}

function FileTypeIcon({ mimeType }: { mimeType?: string | null }) {
  if (mimeType?.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

export default function PortalPodFilesPage() {
  const router = useRouter();

  // Root folder assigned to this customer — they cannot navigate above this
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [rootFolderName, setRootFolderName] = useState<string>("POD Files");
  const [accessChecked, setAccessChecked] = useState(false);

  const [folders, setFolders] = useState<PodFolder[]>([]);
  const [files, setFiles] = useState<PodFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<PodFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("MP Transport");
  const [error, setError] = useState("");

  async function downloadFile(filePath: string, filename: string) {
    const url = filePath.includes("?") ? `${filePath}&download=1` : `${filePath}?download=1`;
    const res = await fetch(url);
    if (!res.ok) return;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl; a.download = filename; a.click();
    URL.revokeObjectURL(objectUrl);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function downloadSelected() {
    for (const file of files.filter(f => selectedIds.has(f.id))) {
      await downloadFile(file.filePath, file.filename);
      await new Promise(r => setTimeout(r, 250));
    }
  }

  // Load branding
  useEffect(() => {
    fetch("/api/branding")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setLogo(d.logo || null); setCompanyName(d.companyName || "MP Transport"); } })
      .catch(() => {});
  }, []);

  // Check access and get assigned root folder
  useEffect(() => {
    fetch("/api/portal/pod-access")
      .then(r => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.ok ? r.json() : null;
      })
      .then(d => {
        if (!d || !d.podManagerAccess) { router.replace("/portal"); return; }
        const assignedFolderId = d.podFolderId ?? null;
        setRootFolderId(assignedFolderId);
        setCurrentFolderId(assignedFolderId);
        setAccessChecked(true);
      })
      .catch(() => router.replace("/portal"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load folder name for root
  useEffect(() => {
    if (!accessChecked) return;
    if (rootFolderId) {
      fetch(`/api/pod-manager/folders`)
        .then(r => r.ok ? r.json() : [])
        .then((allFolders: PodFolder[]) => {
          const root = allFolders.find(f => f.id === rootFolderId);
          const name = root?.name ?? "POD Files";
          setRootFolderName(name);
          setBreadcrumbs([{ id: rootFolderId, name }]);
        })
        .catch(() => setBreadcrumbs([{ id: rootFolderId, name: "POD Files" }]));
    } else {
      // No specific folder assigned — show root
      setBreadcrumbs([{ id: null, name: "POD Files" }]);
    }
  }, [accessChecked, rootFolderId]);

  // Load content whenever currentFolderId or search changes
  // Pass currentFolderId explicitly to avoid stale closure
  useEffect(() => {
    if (!accessChecked) return;
    loadContent(currentFolderId, search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, search, accessChecked]);

  async function loadContent(folderId: string | null, searchTerm: string) {
    setLoading(true);
    try {
      const folderParam = folderId ? `parentId=${folderId}` : "";
      const [fRes, fileRes] = await Promise.all([
        fetch(`/api/pod-manager/folders?${folderParam}`),
        fetch(`/api/pod-manager/files?folderId=${folderId || ""}&search=${encodeURIComponent(searchTerm)}&pageSize=200`),
      ]);
      if (fRes.status === 401 || fileRes.status === 401) { router.push("/login"); return; }
      if (fRes.status === 403 || fileRes.status === 403) { router.replace("/portal"); return; }
      if (fRes.ok) setFolders(await fRes.json());
      if (fileRes.ok) { const d = await fileRes.json(); setFiles(d.files || []); }
    } catch {
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  function navigateTo(folderId: string | null, name: string, fromBreadcrumb = false) {
    // Prevent navigating above the assigned root folder
    if (rootFolderId && folderId === null) return;

    if (fromBreadcrumb) {
      const idx = breadcrumbs.findIndex(b => b.id === folderId);
      if (idx >= 0) setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
    } else if (folderId !== null) {
      setBreadcrumbs(prev => [...prev, { id: folderId, name }]);
    }
    setCurrentFolderId(folderId);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  if (error) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 text-center max-w-sm">
        <p className="text-slate-600">{error}</p>
        <Link href="/portal" className="mt-4 inline-block text-blue-600 text-sm hover:underline">← Back to Portal</Link>
      </div>
    </div>
  );

  if (!accessChecked) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {logo
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logo} alt={companyName} className="h-10 w-auto object-contain" />
            : <span className="text-xl font-bold tracking-tight">{companyName}</span>}
          <div>
            <p className="text-sm font-bold tracking-tight leading-none">POD Portal</p>
            <p className="text-blue-200 text-xs mt-0.5">Your proof of delivery documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portal"
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Bookings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 flex-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
                <button
                  onClick={() => navigateTo(crumb.id, crumb.name, true)}
                  className={clsx(
                    "hover:text-blue-600 truncate max-w-[140px]",
                    i === breadcrumbs.length - 1 ? "font-semibold text-slate-800" : "text-slate-500"
                  )}
                >
                  {i === 0
                    ? <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" />{crumb.name}</span>
                    : crumb.name}
                </button>
              </span>
            ))}
          </nav>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sub-folders */}
            {folders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Folders</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => navigateTo(folder.id, folder.name)}
                      className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-center"
                    >
                      <FolderOpen className="w-10 h-10 text-amber-400" />
                      <p className="text-xs font-medium text-slate-700 truncate w-full">{folder.name}</p>
                      {(() => {
                        const total = (folder as any).totalFiles ?? folder._count?.files ?? 0;
                        const subs = folder._count?.children ?? 0;
                        return (
                          <p className="text-xs text-slate-400">
                            {total > 0
                              ? `${total} file${total !== 1 ? "s" : ""}`
                              : subs > 0
                                ? `${subs} folder${subs !== 1 ? "s" : ""}`
                                : "empty"}
                          </p>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Files ({files.length}{search ? ` matching "${search}"` : ""})
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button onClick={downloadSelected}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                        <Download className="w-3.5 h-3.5" /> Download ({selectedIds.size})
                      </button>
                    )}
                    <button onClick={() => setSelectedIds(selectedIds.size === files.length ? new Set() : new Set(files.map(f => f.id)))}
                      className="text-xs text-blue-600 hover:underline">
                      {selectedIds.size === files.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {files.map((file, i) => {
                    const isImage = file.mimeType?.startsWith("image/");
                    const isPdf = file.mimeType === "application/pdf";
                    const selected = selectedIds.has(file.id);
                    return (
                      <div key={file.id}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors",
                          i > 0 && "border-t border-slate-100",
                          selected && "bg-blue-50"
                        )}
                      >
                        {/* Checkbox */}
                        <button onClick={() => toggleSelect(file.id)} className="shrink-0 p-0.5">
                          {selected
                            ? <div className="w-4 h-4 rounded bg-blue-600 border border-blue-600 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                            : <div className="w-4 h-4 rounded border border-slate-300 bg-white" />}
                        </button>

                        {/* Thumbnail or icon */}
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                          onClick={() => (isImage || isPdf) ? setPreviewFile(file) : downloadFile(file.filePath, file.filename)}
                        >
                          {isImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={file.filePath} alt={file.filename} className="w-full h-full object-cover" />
                          ) : (
                            <FileTypeIcon mimeType={file.mimeType} />
                          )}
                        </div>

                        {/* Name & meta */}
                        <button
                          onClick={() => (isImage || isPdf) ? setPreviewFile(file) : downloadFile(file.filePath, file.filename)}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-medium text-slate-700 truncate hover:text-blue-600">{file.filename}</p>
                          <p className="text-xs text-slate-400">{formatBytes(file.fileSize)} · {formatDate(file.createdAt)}</p>
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => downloadFile(file.filePath, file.filename)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FolderOpen className="w-14 h-14 mb-3 text-slate-300" />
                <p className="font-medium text-slate-500">No POD files yet</p>
                <p className="text-sm mt-1 text-center">Files will appear here once your deliveries are completed and processed</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* File preview lightbox (image + PDF) */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
              <p className="font-semibold text-slate-800 truncate">{previewFile.filename}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadFile(previewFile.filePath, previewFile.filename)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4 min-h-0">
              {previewFile.mimeType === "application/pdf" ? (
                <iframe src={previewFile.filePath} title={previewFile.filename}
                  className="w-full rounded-lg border border-slate-200"
                  style={{ height: "calc(92vh - 120px)" }} />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewFile.filePath} alt={previewFile.filename} className="max-w-full max-h-full object-contain rounded-lg" />
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500 flex gap-4 shrink-0">
              <span>{formatBytes(previewFile.fileSize)}</span>
              <span>{formatDate(previewFile.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
