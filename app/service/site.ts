export interface SiteData {
    id: number;
    latitude: number;
    longitude: number;
    address: string;
    name: string;
    desc: string;
}

export const fetchSiteData = async (): Promise<SiteData[]> => {
    const response = await fetch('/api/sites');
    if (!response.ok) {
      throw new Error('Failed to fetch site data');
    }
    const data = await response.json();
    return data.sites;
};