"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import {
  Folder, FolderOpen, FolderPlus, File, Image as ImageIcon, FileText,
  Upload, Download, Trash2, Pencil, Move, Copy, Search,
  ChevronRight, Home, X, Check, AlertTriangle, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Archive,
  CheckSquare, Square, Settings, Users, ShieldCheck, Eye
} from "lucide-react";
import clsx from "clsx";
import { usePermissions } from "@/lib/use-permissions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PodFolder {
  id: string;
  name: string;
  parentId: string | null;
  customerId: string | null;
  createdAt: string;
  _count?: { files: number; children: number };
  customer?: { id: string; name: string } | null;
}

interface PodFile {
  id: string;
  filename: string;
  storedName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number;
  folderId: string | null;
  customerId: string | null;
  bookingId: string | null;
  createdAt: string;
  customer?: { id: string; name: string } | null;
}

interface BreadcrumbItem { id: string | null; name: string }

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return s; }
}

function FileIcon({ mimeType, size = 16 }: { mimeType?: string | null; size?: number }) {
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const cls = `w-${size === 16 ? 4 : 5} h-${size === 16 ? 4 : 5}`;
  if (isImage) return <ImageIcon className={`${cls} text-blue-500`} />;
  if (isPdf) return <FileText className={`${cls} text-red-500`} />;
  return <File className={`${cls} text-slate-400`} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PodManagerInner() {
  const { has } = usePermissions();
  const searchParams = useSearchParams();
  const customerFilter = searchParams.get("customerId") || undefined;

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: "Root" }]);
  const [folderTree, setFolderTree] = useState<PodFolder[]>([]);

  // Content state
  const [folders, setFolders] = useState<PodFolder[]>([]);
  const [files, setFiles] = useState<PodFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search & sort
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"filename" | "createdAt" | "fileSize">("filename");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ type: "folder" | "file"; id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "folder" | "file" | "bulk"; ids: string[]; label: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ type: "file" | "bulk"; ids: string[] } | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PodFile | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  // Upload
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const pageSize = 50;

  // ── Permissions shortcuts
  const canUpload = has("pod_manager_upload") || has("admin");
  const canMove = has("pod_manager_move") || has("admin");
  const canRename = has("pod_manager_rename") || has("admin");
  const canDelete = has("pod_manager_delete") || has("admin");
  const canManage = has("pod_manager_manage") || has("admin");
  const canShare = has("pod_manager_share") || has("admin");
  const isAdmin = has("admin");

  // ── Data fetching
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(currentFolderId ? { parentId: currentFolderId } : {}),
        ...(customerFilter ? { customerId: customerFilter } : {}),
        sort: sort === "filename" ? "name" : sort,
        dir: sortDir,
      });
      const [fRes, fileRes] = await Promise.all([
        fetch(`/api/pod-manager/folders?${params}`),
        fetch(`/api/pod-manager/files?${new URLSearchParams({
          folderId: currentFolderId || "",
          ...(customerFilter ? { customerId: customerFilter } : {}),
          search,
          sort: sort === "filename" ? "filename" : sort,
          dir: sortDir,
          page: String(page),
          pageSize: String(pageSize),
        })}`),
      ]);
      if (fRes.ok) setFolders(await fRes.json());
      if (fileRes.ok) {
        const d = await fileRes.json();
        setFiles(d.files);
        setTotalFiles(d.total);
        setPages(d.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, search, sort, sortDir, page, customerFilter]);

  const loadFolderTree = useCallback(async () => {
    const res = await fetch("/api/pod-manager/folders");
    if (res.ok) setFolderTree(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadFolderTree(); }, [loadFolderTree]);
  useEffect(() => { setPage(1); }, [currentFolderId, search, sort, sortDir]);

  // ── Navigation
  function navigateTo(folderId: string | null, name: string, fromBreadcrumb = false) {
    if (fromBreadcrumb) {
      // Clicking a breadcrumb — trim back to that point
      const idx = breadcrumbs.findIndex(b => b.id === folderId);
      setBreadcrumbs(idx >= 0 ? breadcrumbs.slice(0, idx + 1) : [{ id: null, name: "Root" }]);
    } else if (folderId !== null) {
      // Clicking a folder card or sidebar item — only append if not already in trail
      setBreadcrumbs(prev => {
        const alreadyAt = prev.findIndex(b => b.id === folderId);
        if (alreadyAt >= 0) return prev.slice(0, alreadyAt + 1); // trim to that point
        return [...prev, { id: folderId, name }];
      });
    }
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
  }

  // ── Sort toggle
  function toggleSort(field: "filename" | "createdAt" | "fileSize") {
    if (sort === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: "filename" | "createdAt" | "fileSize" }) {
    if (sort !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
  }

  // ── Selection
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAll() {
    const allIds = files.map(f => f.id);
    setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  }

  // ── Create folder
  async function createFolder() {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/pod-manager/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim(), parentId: currentFolderId, customerId: customerFilter || null }),
    });
    if (res.ok) {
      toast.success("Folder created");
      setShowNewFolder(false);
      setNewFolderName("");
      load();
      loadFolderTree();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to create folder");
    }
  }

  // ── Rename
  async function doRename() {
    if (!renameTarget || !renameName.trim()) return;
    const url = renameTarget.type === "folder"
      ? `/api/pod-manager/folders/${renameTarget.id}`
      : `/api/pod-manager/files/${renameTarget.id}`;
    const body = renameTarget.type === "folder"
      ? { name: renameName.trim() }
      : { filename: renameName.trim() };
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success("Renamed");
      setRenameTarget(null);
      load();
      if (renameTarget.type === "folder") loadFolderTree();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to rename");
    }
  }

  // ── Delete
  async function doDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "folder") {
      const res = await fetch(`/api/pod-manager/folders/${deleteTarget.ids[0]}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Folder deleted");
        // If we're currently inside the deleted folder, navigate to its parent
        if (currentFolderId === deleteTarget.ids[0]) {
          const parentCrumb = breadcrumbs[breadcrumbs.length - 2] ?? { id: null, name: "Root" };
          setBreadcrumbs(prev => prev.slice(0, -1).length > 0 ? prev.slice(0, -1) : [{ id: null, name: "Root" }]);
          setCurrentFolderId(parentCrumb.id);
        }
        load();
        loadFolderTree();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to delete folder");
      }
    } else if (deleteTarget.type === "file") {
      const res = await fetch(`/api/pod-manager/files/${deleteTarget.ids[0]}`, { method: "DELETE" });
      if (res.ok) { toast.success("File deleted"); load(); }
      else toast.error("Failed to delete file");
    } else {
      // bulk
      const res = await fetch("/api/pod-manager/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", fileIds: deleteTarget.ids }),
      });
      if (res.ok) { toast.success(`${deleteTarget.ids.length} files deleted`); setSelectedIds(new Set()); load(); }
      else toast.error("Failed to delete files");
    }
    setDeleteTarget(null);
  }

  // ── Move
  async function doMove() {
    if (!moveTarget) return;
    const res = await fetch("/api/pod-manager/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", fileIds: moveTarget.ids, folderId: moveFolderId }),
    });
    if (res.ok) { toast.success("Files moved"); setMoveTarget(null); setSelectedIds(new Set()); load(); }
    else toast.error("Failed to move files");
  }

  // ── Upload
  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("folderId", currentFolderId || "");
    if (customerFilter) fd.append("customerId", customerFilter);
    Array.from(fileList).forEach(f => fd.append("file", f));
    try {
      const res = await fetch("/api/pod-manager/files", { method: "POST", body: fd });
      if (res.ok) { toast.success(`${fileList.length} file(s) uploaded`); load(); }
      else { const d = await res.json(); toast.error(d.error || "Upload failed"); }
    } finally { setUploading(false); if (uploadRef.current) uploadRef.current.value = ""; }
  }

  // ── Download as ZIP (client-side via JSZip if available, else individual downloads)
  async function downloadSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const res = await fetch("/api/pod-manager/download-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: ids }),
    });
    if (!res.ok) { toast.error("Failed to prepare download"); return; }
    const { files: fileList } = await res.json();

    if (fileList.length === 1) {
      // Single file — direct download
      const a = document.createElement("a");
      a.href = fileList[0].filePath;
      a.download = fileList[0].filename;
      a.click();
      return;
    }

    // Multiple files: try JSZip if available in window, else fall back to individual downloads
    const w = window as any;
    if (w.JSZip) {
      const zip = new w.JSZip();
      for (const f of fileList) {
        const blob = await fetch(f.filePath).then(r => r.blob());
        zip.file(f.filename, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pod-files.zip";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Sequential individual downloads
      for (const f of fileList) {
        const a = document.createElement("a");
        a.href = f.filePath;
        a.download = f.filename;
        a.click();
        await new Promise(r => setTimeout(r, 300));
      }
      toast.success(`${fileList.length} files downloading...`);
    }
  }

  // ── Drag & Drop
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function onDragLeave() { setDragOver(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (canUpload) handleUpload(e.dataTransfer.files);
  }

  // ── Folder tree (sidebar) — recursive render
  function FolderTreeItem({ folder, depth = 0 }: { folder: PodFolder; depth?: number }) {
    const children = folderTree.filter(f => f.parentId === folder.id);
    const isActive = currentFolderId === folder.id;
    // Check if this folder is already in the breadcrumb trail
    const alreadyInTrail = breadcrumbs.some(b => b.id === folder.id);
    return (
      <div>
        <button
          onClick={() => {
            if (alreadyInTrail) {
              // Navigate via breadcrumb logic to avoid duplicates
              navigateTo(folder.id, folder.name, true);
            } else {
              navigateTo(folder.id, folder.name, false);
            }
          }}
          className={clsx(
            "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
            isActive ? "bg-blue-100 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100",
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {isActive ? <FolderOpen className="w-4 h-4 shrink-0 text-blue-600" /> : <Folder className="w-4 h-4 shrink-0 text-amber-500" />}
          <span className="truncate flex-1">{folder.name}</span>
          {(() => {
            const total = (folder as any).totalFiles ?? (folder._count ? folder._count.files + folder._count.children : 0);
            return total > 0 ? <span className="text-xs text-slate-400 shrink-0">{total}</span> : null;
          })()}
        </button>
        {children.map(c => <FolderTreeItem key={c.id} folder={c} depth={depth + 1} />)}
      </div>
    );
  }

  const rootFolders = folderTree.filter(f => f.parentId === null);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="POD Manager" subtitle="Proof of Delivery File Manager" />

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar: Folder Tree ── */}
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Folders</p>
            {canManage && (
              <button
                onClick={() => setShowNewFolder(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                <FolderPlus className="w-3.5 h-3.5" /> New Folder
              </button>
            )}
          </div>
          <div className="p-2 flex-1">
            {/* Root */}
            <button
              onClick={() => navigateTo(null, "Root", true)}
              className={clsx(
                "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-left transition-colors mb-1",
                currentFolderId === null ? "bg-blue-100 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Root</span>
            </button>
            {rootFolders.map(f => <FolderTreeItem key={f.id} folder={f} />)}
          </div>
          {isAdmin && (
            <div className="p-2 border-t border-slate-100">
              <button
                onClick={() => setShowPermissions(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Permissions
              </button>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {/* Toolbar */}
          <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center gap-2">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 flex-1 min-w-0 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
                  <button
                    onClick={() => navigateTo(crumb.id, crumb.name, true)}
                    className={clsx(
                      "hover:text-blue-600 truncate max-w-[120px]",
                      i === breadcrumbs.length - 1 ? "font-semibold text-slate-800" : "text-slate-500"
                    )}
                  >
                    {crumb.name}
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
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
            </div>

            {/* Actions */}
            {canUpload && (
              <button
                onClick={() => uploadRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
            )}

            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={downloadSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                >
                  <Download className="w-3.5 h-3.5" /> Download ({selectedIds.size})
                </button>
                {canMove && (
                  <button
                    onClick={() => { setMoveTarget({ type: "bulk", ids: [...selectedIds] }); setMoveFolderId(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
                  >
                    <Move className="w-3.5 h-3.5" /> Move ({selectedIds.size})
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeleteTarget({ type: "bulk", ids: [...selectedIds], label: `${selectedIds.size} files` })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
                  </button>
                )}
                <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <input ref={uploadRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => handleUpload(e.target.files)} />
          </div>

          {/* Drop zone + content */}
          <div
            className={clsx("flex-1 overflow-auto p-4", dragOver && "ring-2 ring-inset ring-blue-500 bg-blue-50/30")}
            onDragOver={canUpload ? onDragOver : undefined}
            onDragLeave={canUpload ? onDragLeave : undefined}
            onDrop={canUpload ? onDrop : undefined}
          >
            {dragOver && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-blue-600 text-white rounded-2xl px-6 py-4 text-base font-bold shadow-2xl flex items-center gap-3">
                  <Upload className="w-6 h-6" /> Drop to upload
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Folders */}
                {folders.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Folders</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {folders.map(folder => (
                        <div key={folder.id}
                          className="group relative bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all p-3 cursor-pointer select-none"
                          onClick={() => navigateTo(folder.id, folder.name)}>
                          <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                            <FolderOpen className="w-10 h-10 text-amber-400" />
                            <p className="text-xs font-medium text-slate-700 leading-tight line-clamp-2">{folder.name}</p>
                            {(() => {
                              const total = (folder as any).totalFiles ?? folder._count?.files ?? 0;
                              const subFolders = folder._count?.children ?? 0;
                              return (
                                <p className="text-xs text-slate-400">
                                  {total > 0
                                    ? `${total} file${total !== 1 ? "s" : ""}${subFolders > 0 ? ` in ${subFolders} folder${subFolders !== 1 ? "s" : ""}` : ""}`
                                    : subFolders > 0
                                      ? `${subFolders} folder${subFolders !== 1 ? "s" : ""}`
                                      : "empty"}
                                </p>
                              );
                            })()}
                            {folder.customer && (
                              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100 truncate max-w-full">
                                {folder.customer.name}
                              </span>
                            )}
                          </div>
                          {/* Context menu — pointer-events-auto so clicks reach these buttons */}
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5 pointer-events-auto">
                            {canRename && (
                              <button onClick={e => { e.stopPropagation(); setRenameTarget({ type: "folder", id: folder.id, name: folder.name }); setRenameName(folder.name); }}
                                className="p-1 bg-white border border-slate-200 rounded text-slate-500 hover:text-blue-600 shadow-sm z-10">
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: "folder", ids: [folder.id], label: folder.name }); }}
                                className="p-1 bg-white border border-slate-200 rounded text-slate-500 hover:text-rose-600 shadow-sm z-10">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files table */}
                {files.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Files ({totalFiles}{search ? ` matching "${search}"` : ""})
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      {/* Table header */}
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_80px_80px_100px] gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <div className="flex items-center">
                          <button onClick={selectAll} className="p-0.5 rounded hover:bg-slate-200">
                            {selectedIds.size === files.length && files.length > 0
                              ? <CheckSquare className="w-4 h-4 text-blue-600" />
                              : <Square className="w-4 h-4" />}
                          </button>
                        </div>
                        <button onClick={() => toggleSort("filename")} className="flex items-center gap-1 text-left hover:text-slate-700">
                          Name <SortIcon field="filename" />
                        </button>
                        <button onClick={() => toggleSort("fileSize")} className="flex items-center gap-1 hover:text-slate-700">
                          Size <SortIcon field="fileSize" />
                        </button>
                        <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-slate-700">
                          Date <SortIcon field="createdAt" />
                        </button>
                        <span>Actions</span>
                      </div>

                      {/* Rows */}
                      {files.map(file => {
                        const isImage = file.mimeType?.startsWith("image/");
                        const isPdf = file.mimeType === "application/pdf";
                        const selected = selectedIds.has(file.id);
                        return (
                          <div key={file.id}
                            className={clsx(
                              "grid grid-cols-[auto_minmax(0,1fr)_80px_100px_100px] gap-2 px-3 py-2.5 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50 transition-colors text-sm",
                              selected && "bg-blue-50"
                            )}
                          >
                            <button onClick={() => toggleSelect(file.id)} className="p-0.5 rounded hover:bg-slate-200 shrink-0">
                              {selected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                            </button>
                            <div className="flex items-center gap-2 min-w-0">
                              {isImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={file.filePath} alt="" className="w-8 h-8 rounded object-cover border border-slate-100 shrink-0 cursor-pointer" onClick={() => setPreviewFile(file)} />
                              ) : (
                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                  <FileIcon mimeType={file.mimeType} size={20} />
                                </div>
                              )}
                              <button
                                onClick={() => isImage ? setPreviewFile(file) : isPdf ? setPreviewFile(file) : window.open(file.filePath, "_blank")}
                                className="text-slate-700 font-medium truncate text-left hover:text-blue-600 max-w-[200px]"
                                title={file.filename}
                              >
                                {file.filename}
                              </button>
                            </div>
                            <span className="text-xs text-slate-500">{formatBytes(file.fileSize)}</span>
                            <span className="text-xs text-slate-500">{formatDate(file.createdAt)}</span>
                            <div className="flex items-center gap-0.5">
                              <a href={file.filePath} download={file.filename}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50" title="Download">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              {canRename && (
                                <button onClick={() => { setRenameTarget({ type: "file", id: file.id, name: file.filename }); setRenameName(file.filename); }}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Rename">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canMove && (
                                <button onClick={() => { setMoveTarget({ type: "file", ids: [file.id] }); setMoveFolderId(null); }}
                                  className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50" title="Move">
                                  <Move className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button onClick={() => setDeleteTarget({ type: "file", ids: [file.id], label: file.filename })}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                      <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
                        <span>Page {page} of {pages} ({totalFiles} files)</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-xs">Prev</button>
                          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
                            className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-xs">Next</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  folders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <FolderOpen className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-medium">This folder is empty</p>
                      {canUpload && <p className="text-sm mt-1">Drag & drop files here or use the Upload button</p>}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}

      {/* New Folder */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-amber-500" /> New Folder</h2>
            <input autoFocus type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createFolder()}
              placeholder="Folder name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={createFolder} disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-500" /> Rename {renameTarget.type}
            </h2>
            <input autoFocus type="text" value={renameName} onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doRename()}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRenameTarget(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={doRename} disabled={!renameName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Delete {deleteTarget.type === "bulk" ? `${deleteTarget.ids.length} files` : deleteTarget.type}?</p>
                <p className="text-sm text-slate-500 truncate">{deleteTarget.label}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">This will move the item(s) to the deleted state. Files can be recovered by an admin.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={doDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Move */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Move className="w-5 h-5 text-amber-500" /> Move to folder</h2>
            <div className="space-y-1">
              <button onClick={() => setMoveFolderId(null)}
                className={clsx("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left", moveFolderId === null ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-slate-50")}>
                <Home className="w-4 h-4" /> Root
              </button>
              {folderTree.map(f => (
                <button key={f.id} onClick={() => setMoveFolderId(f.id)}
                  className={clsx("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left", moveFolderId === f.id ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-slate-50")}>
                  <Folder className="w-4 h-4 text-amber-500" /> {f.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setMoveTarget(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={doMove} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">Move Here</button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview (image + PDF) */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
              <p className="font-semibold text-slate-800 truncate">{previewFile.filename}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(previewFile.filePath);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = previewFile.filename;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      toast.error("Download failed — file may not exist on server yet");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4 min-h-0">
              {previewFile.mimeType === "application/pdf" ? (
                <iframe
                  src={previewFile.filePath}
                  title={previewFile.filename}
                  className="w-full rounded-lg border border-slate-200"
                  style={{ height: "calc(92vh - 120px)" }}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewFile.filePath} alt={previewFile.filename} className="max-w-full max-h-full object-contain rounded-lg" />
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500 flex gap-4 shrink-0">
              <span>{formatBytes(previewFile.fileSize)}</span>
              <span>{formatDate(previewFile.createdAt)}</span>
              {previewFile.customer && <span>Customer: {previewFile.customer.name}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Permissions Panel */}
      {showPermissions && isAdmin && (
        <PermissionsPanel onClose={() => setShowPermissions(false)} />
      )}
    </div>
  );
}

// ─── Default export with Suspense boundary ────────────────────────────────────

export default function PodManagerPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <PodManagerInner />
    </Suspense>
  );
}

// ─── Permissions Panel ─────────────────────────────────────────────────────────

function PermissionsPanel({ onClose }: { onClose: () => void }) {
  const [perms, setPerms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({
    userId: "", roleId: "", customerId: "",
    canUpload: false, canMove: false, canRename: false,
    canDelete: false, canShare: false, canManage: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pod-manager/permissions").then(r => r.json()),
      fetch("/api/users?limit=200").then(r => r.ok ? r.json() : []),
      fetch("/api/roles").then(r => r.ok ? r.json() : []),
      fetch("/api/customers?limit=200").then(r => r.ok ? r.json() : []),
    ]).then(([p, u, ro, c]) => {
      setPerms(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u?.users) ? u.users : Array.isArray(u) ? u : []);
      setRoles(Array.isArray(ro) ? ro : []);
      setCustomers(Array.isArray(c?.customers) ? c.customers : Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  async function save() {
    const res = await fetch("/api/pod-manager/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Permission saved");
      const p = await fetch("/api/pod-manager/permissions").then(r => r.json());
      setPerms(Array.isArray(p) ? p : []);
      setForm({ userId: "", roleId: "", customerId: "", canUpload: false, canMove: false, canRename: false, canDelete: false, canShare: false, canManage: false });
    } else toast.error("Failed to save");
  }

  async function deletePerm(id: string) {
    await fetch(`/api/pod-manager/permissions?id=${id}`, { method: "DELETE" });
    setPerms(p => p.filter(x => x.id !== id));
    toast.success("Removed");
  }

  const Toggle = ({ field }: { field: keyof typeof form }) => (
    <button type="button"
      onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
      className={clsx("w-8 h-4 rounded-full transition-colors", form[field] ? "bg-blue-600" : "bg-slate-300")}
    >
      <span className={clsx("block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5", form[field] ? "translate-x-3.5" : "translate-x-0")} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> POD Manager Permissions</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Add new permission */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Add Permission Rule</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">User</label>
                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any user</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Role</label>
                <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any role</option>
                  {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Customer (folder scope)</label>
                <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All customers</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {(["canUpload","canMove","canRename","canDelete","canShare","canManage"] as const).map(f => (
                <label key={f} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <Toggle field={f} />
                  {f.replace("can", "")}
                </label>
              ))}
            </div>
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <Check className="w-4 h-4" /> Save Rule
            </button>
          </div>

          {/* Existing permissions */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : perms.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No permission rules yet</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left pb-2">User / Role</th>
                  <th className="text-left pb-2">Customer Scope</th>
                  <th className="text-left pb-2">Permissions</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {perms.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">{p.userId ? `User:${p.userId.slice(-6)}` : p.roleId ? `Role:${p.roleId.slice(-6)}` : "All"}</td>
                    <td className="py-2">{p.customerId ? p.customerId.slice(-6) : "All"}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.canUpload && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Upload</span>}
                        {p.canMove && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Move</span>}
                        {p.canRename && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Rename</span>}
                        {p.canDelete && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Delete</span>}
                        {p.canShare && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Share</span>}
                        {p.canManage && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Manage</span>}
                      </div>
                    </td>
                    <td className="py-2">
                      <button onClick={() => deletePerm(p.id)} className="text-rose-500 hover:text-rose-700"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
