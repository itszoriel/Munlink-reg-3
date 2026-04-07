# MunLink Permissions Matrix

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        SuperAdmin                            │
│  Platform-level control, creates all other admin types      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┬──────────────────────┐
        │                     │                     │                      │
┌───────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐  ┌─────────▼────────┐
│ Provincial Admin│  │ Municipal Admin │  │ Barangay Admin  │  │    Resident      │
│ Province-wide   │  │ Municipality     │  │ Barangay-level  │  │  Public User     │
│ announcements   │  │ management      │  │ announcements   │  │  Services        │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────────┘
```

## Role Definitions

### 1. SuperAdmin
**Purpose**: Platform-level administration
**Login**: Requires 2FA via email (6-digit code)
**Portal**: `/superadmin`

### 2. Provincial Admin
**Purpose**: Province-wide communication (Zambales only)
**Login**: Username/password
**Portal**: `/provincial/*`

### 3. Municipal Admin
**Purpose**: Municipality-level services and management
**Login**: Username/password
**Portal**: `/dashboard`, `/residents`, `/programs`, etc.

### 4. Barangay Admin
**Purpose**: Barangay-level community communication
**Login**: Username/password
**Portal**: `/barangay/*`

### 5. Resident
**Purpose**: Access to municipal services
**Login**: Username/password or email/password
**Portal**: Web app (`/dashboard`, `/documents`, `/marketplace`, etc.)

---

## Permissions Matrix

| Feature/Action | SuperAdmin | Provincial Admin | Municipal Admin | Barangay Admin | Resident |
|----------------|------------|------------------|-----------------|----------------|----------|
| **User Management** |
| Create SuperAdmin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Provincial Admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Municipal Admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Barangay Admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Admin Accounts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Admin Accounts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Residents | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| View Residents | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| **Announcements** |
| Create PROVINCE-scoped | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create MUNICIPALITY-scoped | ✅ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Create BARANGAY-scoped | ✅ | ❌ | ❌ | ✅ (own barangay) | ❌ |
| Edit Scoped Announcements | ✅ | ✅ (province) | ✅ (own municipality scope) | ✅ (own barangay scope) | ❌ |
| Delete Scoped Announcements | ✅ | ✅ (province) | ✅ (own municipality scope) | ✅ (own barangay scope) | ❌ |
| View Province Announcements | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Municipality Announcements | ✅ | ✅ | ✅ (own or shared target) | ✅ (if in municipality) | ✅ (selected/shared target) |
| View Barangay Announcements | ✅ | ✅ | ✅ (own municipality) | ✅ (own) | ✅ (selected) |
| Share Cross-Municipality | ✅ (municipality scope) | ❌ | ✅ (own municipality source only) | ❌ | ❌ |
| **Document Requests** |
| Process Requests | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Generate Certificates | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Verify QR Codes | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Request Documents | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Marketplace** |
| Moderate Listings | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Approve/Reject Listings | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Create Listings | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Listings | ❌ | ❌ | ✅ (own municipality) | ❌ | ✅ (selected location) |
| **Problem Reports** |
| Triage Reports | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Update Status | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Add Comments | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Submit Reports | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Benefit Programs** |
| Create Programs | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Edit Programs | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Delete Programs | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Manage Applicants | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| Apply for Programs | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reports & Analytics** |
| View Province-wide Reports | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Municipality Reports | ❌ | ❌ | ✅ (own municipality) | ❌ | ❌ |
| View Barangay Reports | ❌ | ❌ | ❌ | ✅ (own barangay) | ❌ |
| Export Data | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Audit Logs** |
| View Platform Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Own Actions | ❌ | ✅ | ✅ | ✅ | ❌ |
| **System Configuration** |
| Configure Email/SMS | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Database | ✅ | ❌ | ❌ | ❌ | ❌ |
| View System Logs | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Scope Restrictions

### Geographic Scope

| Role | Province | Municipality | Barangay |
|------|----------|--------------|----------|
| SuperAdmin | All | All | All |
| Provincial Admin | Zambales only | All 13 municipalities | All barangays |
| Municipal Admin | Zambales (implicit) | Own municipality only | All barangays in municipality |
| Barangay Admin | Zambales (implicit) | Own municipality (implicit) | Own barangay only |
| Resident | Zambales (browsing) | Selected municipality (browsing) | Selected barangay (browsing) |

### Content Visibility (Announcements)

**PROVINCE Scope:**
- Created by: Provincial Admin or SuperAdmin
- Visible to: All users in Zambales (all municipalities and barangays)
- Cannot be shared cross-municipality (already province-wide)

**MUNICIPALITY Scope:**
- Created by: Municipal Admin or SuperAdmin
- Visible to: Source municipality plus any additional valid Zambales municipalities in `shared_with_municipalities`
- Registered residents can access it in their home municipality feed/detail or by explicitly browsing a targeted municipality
- Guests do not access municipality announcement feed/detail in the current implementation

**BARANGAY Scope:**
- Created by: Barangay Admin or SuperAdmin
- Visible to: All users in that specific barangay only
- Sharing does not apply in this implementation; legacy sharing metadata does not widen feed/detail access

---

## Authentication Requirements

| Role | Password | 2FA Email | IP Allowlist | Session Timeout |
|------|----------|-----------|--------------|----------------|
| SuperAdmin | ✅ | ✅ Required | ✅ Optional | 1 hour |
| Provincial Admin | ✅ | ❌ | ❌ | 24 hours |
| Municipal Admin | ✅ | ❌ | ❌ | 24 hours |
| Barangay Admin | ✅ | ❌ | ❌ | 24 hours |
| Resident | ✅ | ❌ | ❌ | 7 days |

---

## API Route Permissions

### SuperAdmin Routes (`/api/superadmin/*`)
- **Required Role**: `superadmin`
- **2FA**: Required
- **Routes**:
  - `POST /login` - 2FA credential check + email code send
  - `POST /verify-2fa` - Verify 6-digit code
  - `POST /resend-code` - Resend 2FA code
  - `POST /create-admin` - Create any admin type
  - `GET /admins` - List all admins
  - `PUT /admins/:id` - Update admin
  - `DELETE /admins/:id` - Delete admin
  - `GET /audit-log` - View platform audit log

### Admin Routes (`/api/admin/*`)
- **Required Roles**: `municipal_admin`, `provincial_admin`, `barangay_admin`, `superadmin`
- **Routes**:
  - `POST /login` - Standard username/password
  - `GET /residents` - List residents (scoped to municipality)
  - `POST /verify-user/:id` - Approve/reject resident
  - `GET /documents/requests` - List document requests
  - `POST /documents/approve/:id` - Approve document
  - `GET /marketplace` - List marketplace items (for moderation)
  - `PUT /marketplace/:id/moderate` - Approve/reject listing
  - `GET /issues` - List problem reports
  - `PUT /issues/:id` - Update problem status
  - `GET /programs` - List benefit programs
  - `POST /programs` - Create program
  - `GET /announcements` - List announcements (scoped)
  - `POST /announcements` - Create announcement (scoped)

### Resident Routes (`/api/auth/*`, `/api/documents/*`, `/api/marketplace/*`, etc.)
- **Required Role**: `resident`
- **Routes**: All user-facing features (documents, marketplace, problems, programs)

---

## Security Notes

1. **SuperAdmin** accounts have mandatory 2FA and optional IP allowlisting for maximum security
2. **Provincial/Municipal/Barangay Admins** use standard password authentication
3. **Announcement sharing** is active only for `MUNICIPALITY` scope via `shared_with_municipalities`; `public_viewable` remains deprecated compatibility metadata and does not drive feed/detail visibility
4. **Scope validation** happens at both frontend (UI) and backend (API) levels
5. **Audit logging** tracks all SuperAdmin actions for accountability
6. **Session management** prevents concurrent sessions and enforces timeouts
7. **Rate limiting** protects against brute force attacks on all login endpoints

---

## Testing Checklist

### SuperAdmin
- [ ] Cannot access without 2FA code
- [ ] Can create all admin types
- [ ] Can create PROVINCE, MUNICIPALITY, and BARANGAY announcements
- [ ] Can view audit logs
- [ ] Sessions expire after 1 hour
- [ ] IP allowlist works correctly (if enabled)

### Provincial Admin
- [ ] Can only create PROVINCE-scoped announcements
- [ ] Announcements visible across all municipalities
- [ ] Cannot access SuperAdmin panel
- [ ] Cannot create/edit users

### Municipal Admin
- [ ] Can only see residents from own municipality
- [ ] Can only process documents from own municipality
- [ ] Announcement create/update can share MUNICIPALITY announcements to additional valid Zambales municipalities
- [ ] Announcement create/update keeps `public_viewable=False`
- [ ] Cannot access province-wide or barangay-specific features

### Barangay Admin
- [ ] Can only create BARANGAY-scoped announcements
- [ ] Announcements only visible in own barangay
- [ ] Cannot access municipal admin features
- [ ] Reports show only barangay data

### Resident
- [ ] Cannot access any admin panels
- [ ] Can see announcements relevant to home location and municipality announcements shared to that location
- [ ] Can browse other valid Zambales municipality/barangay announcement scopes explicitly
- [ ] Can request documents, create marketplace listings, report problems
- [ ] Profile updates persist correctly

---

*Last Updated: January 18, 2026*
*Project: MunLink Zambales*
