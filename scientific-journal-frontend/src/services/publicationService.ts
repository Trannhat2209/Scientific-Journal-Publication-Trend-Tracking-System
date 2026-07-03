export interface PublicationRelationshipNetworkNodeDto {
  id: string;
  label: string;
  type: string;
  title?: string;
  year?: number;
  citationCount?: number;
  authors?: string[];
}

export interface PublicationRelationshipNetworkEdgeDto {
  source: string;
  target: string;
  weight: number;
  relationType: string;
}

export interface PublicationRelationshipNetworkDto {
  nodes: PublicationRelationshipNetworkNodeDto[];
  edges: PublicationRelationshipNetworkEdgeDto[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5227";

// TODO: If the backend network endpoint is not available yet, you can enable this mock data
// and use it as the returned payload for `fetchPublicationRelationshipNetwork`.
// This is only for development fallback and should be replaced with real backend data.
export const MOCK_PUBLICATION_NETWORK: PublicationRelationshipNetworkDto = {
  nodes: [
    {
      id: "1",
      label: "Central Publication",
      type: "Central",
      title: "An Example Publication",
      year: 2024,
      citationCount: 42,
      authors: ["Nguyen Van A"],
    },
    {
      id: "2",
      label: "Related A",
      type: "Publication",
      title: "Related Publication A",
      year: 2023,
      citationCount: 14,
      authors: ["Tran Thi B"],
    },
    {
      id: "3",
      label: "Related B",
      type: "Publication",
      title: "Related Publication B",
      year: 2022,
      citationCount: 8,
      authors: ["Le Van C"],
    },
  ],
  edges: [
    { source: "1", target: "2", weight: 0.68, relationType: "Similarity" },
    { source: "1", target: "3", weight: 0.57, relationType: "Similarity" },
  ],
};

export async function fetchPublicationRelationshipNetwork(
  publicationId: number,
  threshold = 0.3,
): Promise<PublicationRelationshipNetworkDto> {
  const response = await fetch(
    `${API_BASE_URL}/api/publications/${publicationId}/network?threshold=${encodeURIComponent(threshold)}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || `Không thể tải dữ liệu network cho publication ${publicationId}.`,
    );
  }

  return (await response.json()) as PublicationRelationshipNetworkDto;
}
