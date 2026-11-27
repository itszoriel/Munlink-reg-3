// ID verification files live in private storage. The API only tells the client
// which ones exist (`id_documents`); images are fetched through
// GET /api/auth/verification-docs/:docType when the owner needs a preview.

export type IdDocumentFlags = {
  valid_id_front: boolean
  valid_id_back: boolean
  selfie_with_id: boolean
}

type UserWithIdDocuments = {
  id_documents?: Partial<IdDocumentFlags> | null
  // Presence flags kept by the API for older clients.
  valid_id_front?: boolean | string | null
  valid_id_back?: boolean | string | null
  selfie_with_id?: boolean | string | null
}

export function idDocumentFlags(user?: UserWithIdDocuments | null): IdDocumentFlags {
  const docs = user?.id_documents
  return {
    valid_id_front: !!(docs?.valid_id_front ?? user?.valid_id_front),
    valid_id_back: !!(docs?.valid_id_back ?? user?.valid_id_back),
    selfie_with_id: !!(docs?.selfie_with_id ?? user?.selfie_with_id),
  }
}

export function hasUploadedIdDocuments(user?: UserWithIdDocuments | null): boolean {
  const flags = idDocumentFlags(user)
  return flags.valid_id_front || flags.valid_id_back || flags.selfie_with_id
}
