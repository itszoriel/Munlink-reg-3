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

## Sensitive resident records

Viewing ID or selfie files requires `residents:id_view`, a stated viewing reason, watermarking, and an audit event. Approval permission alone does not imply document-view permission.

## Implementation checklist

- Resolve the authenticated user on the backend.
- Check the role and explicit permission.
- Derive admin scope only from admin assignment fields.
- Validate incoming municipality and barangay IDs.
- Apply the scope to every query and mutation.
- Audit sensitive reads and writes.
- Return `403` for authenticated users outside the required role or scope.
