export interface PlaylistInterface {
  collaborative: boolean;
  description: any;
  external_urls: {
    spotify: string;
  };
  followers: {
    href: any;
    total: number;
  };
  href: string;
  id: string;
  images: any[];
  name: string;
  owner: Owner;
  primary_color: any;
  public: boolean;
  snapshot_id: string;
  tracks: Tracks;
  type: string;
  uri: string;
}

interface Owner {
  display_name: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  type: string;
  uri: string;
}

interface Tracks {
  href: string;
  items: any[];
  limit: number;
  next: any;
  offset: number;
  previous: any;
  total: number;
}
