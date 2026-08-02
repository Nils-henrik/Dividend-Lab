export type ContactRelationshipStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "removed";

export type ContactRelationship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ContactRelationshipStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
};

export type ContactProfileSummary = {
  id: string;
  name: string;
  username: string | null;
  initials: string;
  avatarUrl: string | null;
};

export type ContactListItem = {
  connectionId: string;
  profile: ContactProfileSummary;
  since: string;
};

export type ContactRequestItem = {
  connectionId: string;
  profile: ContactProfileSummary;
  createdAt: string;
};

export type ProfileContactState =
  | { kind: "self" }
  | { kind: "signed_out" }
  | { kind: "none" }
  | { kind: "outgoing_pending"; connectionId: string }
  | { kind: "incoming_pending"; connectionId: string }
  | { kind: "accepted"; connectionId: string };

export type ContactActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type ContactConnectionRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  user_low_id: string;
  user_high_id: string;
  status: ContactRelationshipStatus;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
};
