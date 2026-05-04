# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Ready for development

The template is a clean Next.js 16 starter with TypeScript and Tailwind CSS 4. It's ready for AI-assisted expansion to build any type of application.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

The template is ready. Next steps depend on user requirements:

1. What type of application to build
2. What features are needed
3. Design/branding preferences

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-05-04 | POD Manager system + driver PWA photo requirement + postcode-based file naming |

## Recently Completed

- [x] Driver PWA (deliver + via): photo of paperwork now **required** before submission; UI shows red border, required label, red camera button until photo is taken
- [x] POD photos renamed to **postcode format** on upload: `SW1A1AA.jpg`, `SW1A1AA#2.jpg`, etc. Postcode sent from frontend via FormData
- [x] **POD Manager** — full file manager system added at `/admin/pod-manager`:
  - Folder tree navigation (sidebar)
  - Drag & drop file upload
  - Image inline thumbnails + preview lightbox
  - Sortable file list (name, date, size)
  - Pagination (50 per page)
  - Rename files/folders
  - Move/Copy files through folders (bulk & single)
  - Delete files/folders (soft delete)
  - Download single files + multi-file download
  - Quick search
  - Group/bulk actions (move, delete)
  - Customer-scoped storage space
  - Permission system (Upload, Move, Rename, Delete, Share, Manage) tied to roles/users/customers
- [x] **POD Manager modal** on booking detail page — "POD Manager" button appears alongside "POD Verified"; opens inline modal showing files for that booking with import, move, delete, preview, download
- [x] **Sidebar** — "POD Manager" added under Transport group (permission: `pod_manager_view`)
- [x] **Customer detail page** — "POD Manager" button opens POD Manager filtered to that customer's files
- [x] **Prisma schema** — `PodFolder`, `PodFile`, `PodPermission` models added + migration applied
- [x] **API routes**: `/api/pod-manager/folders`, `/api/pod-manager/files`, `/api/pod-manager/bulk`, `/api/pod-manager/permissions`, `/api/pod-manager/import-booking`, `/api/pod-manager/download-zip`

## Current State

**Production-ready build** ✅ — all TypeScript checks pass, build succeeds, zero lint errors.
