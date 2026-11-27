# Permissions and scope

Backend checks are authoritative. Frontend menus and protected routes only mirror these rules.

| Capability | Superadmin | Provincial admin | Municipal admin | Barangay admin | Resident |
| --- | --- | --- | --- | --- | --- |
| Manage admin accounts | All admin roles | No | No | No | No |
| View platform audit log | Yes | No | No | No | No |
| Verify residents | No | No | Own municipality | No | No |
| Process document requests | No | No | Own municipality | No | No |
| Publish province announcements | Yes | Yes | No | No | No |
| Publish municipality announcements | Yes | No | Own municipality | No | No |
| Share municipality announcements | Yes | No | Valid Zambales targets from own municipality | No | No |
| Publish barangay announcements | Yes | No | No | Own barangay | No |
| Manage benefit programs | As explicitly allowed by route | No | Own municipality | Own barangay | No |
| Review benefit applications | As explicitly allowed by route | No | Own municipality | Own barangay | No |
| Moderate marketplace and issues | As explicitly allowed by route | No | Own municipality | No | No |
| Use resident services | No | No | No | No | Own account |

## Geographic rules

- All user-visible locations are inside Zambales province ID `6`.
- Olongapo City ID `130` is excluded.
- Provincial admins are Zambales-wide.
- Municipal admins use `admin_municipality_id`.
- Barangay admins use both `admin_municipality_id` and `admin_barangay_id`.
- Residents use their own `municipality_id` and `barangay_id` for service eligibility and default feeds.

## Announcement visibility

- `PROVINCE`: visible across the supported Zambales scope.
- `MUNICIPALITY`: visible to the source municipality and valid shared municipality targets.
- `BARANGAY`: visible only to the exact barangay audience.
- Registered residents may explicitly browse valid Zambales announcement scopes supported by the API.
- Guests remain province-only for current announcement feeds and detail access.

## Resident account scope

`can_access_resident()` and `resident_scope_conditions()` in `apps/api/utils/admin_scope.py` are the single source of truth for which residents an admin may see or act on:

- Superadmin and provincial admin: any resident in a valid Zambales municipality.
- Municipal admin: residents whose `municipality_id` is their `admin_municipality_id`.
- Barangay admin: residents whose `barangay_id` is their `admin_barangay_id`.
- Admin accounts themselves: superadmin, or admins assigned to the same municipality.

A municipal admin without a valid municipality, or a barangay admin without a valid barangay, has no admin access. Resident detail, pending and verified lists, ID viewing, ID replacement, suspension, and reactivation all use these helpers. Municipal admins may also open residents with an active transfer into or out of their municipality.

## Suspension

- `POST /api/admin/users/<id>/suspend` and `POST /api/admin/users/<id>/reactivate` are separate actions. Each needs `residents:approve`, a reason of 5 to 500 characters, and the resident in scope.
- Suspension sets `is_active = false`, ends every session of the resident at once, and writes a `resident_suspended` audit entry in the same transaction. Reactivation writes `resident_reactivated`.
- Rejecting a verification also deactivates the resident and ends their sessions.

## Sensitive resident records

Viewing ID or selfie files requires `residents:id_view`, a stated viewing reason, watermarking, and an audit event. Approval permission alone does not imply document-view permission. The audit entry is written before the file is streamed; if it cannot be written, the file is not served. Replacing a resident's ID files from the admin app requires `residents:approve` and is audited as `resident_docs_replaced`.

## Audit writes

Audit entries for verification, rejection, suspension, reactivation, ID views, and ID replacement commit in the same transaction as the change: if the audit write fails, the change is rolled back. Other audit writes are best-effort but never silent; failures are logged with a stack trace.

## Implementation checklist

- Resolve the authenticated user on the backend from the database (`load_staff_context()`), never from the JWT role claim.
- Check the role and explicit permission.
- Derive admin scope only from admin assignment fields.
- Validate incoming municipality and barangay IDs.
- Apply the scope to every query and mutation.
- Audit sensitive reads and writes.
- Return `403` for authenticated users outside the required role or scope.
