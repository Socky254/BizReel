export interface VerificationRequest {
  id: string;
  user_id: string;
  business_doc_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export interface IVerificationRepository {
  submitRequest(userId: string, documentUri: string): Promise<VerificationRequest>;
  getLatestRequest(userId: string): Promise<VerificationRequest | null>;
}
