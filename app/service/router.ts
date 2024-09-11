interface RouterData {
    routerId: string;
    name: string;
}

export const fetchRouterNames = async (): Promise<RouterData[]> => {
    const response = await fetch('/api/routers');
    if (!response.ok) {
      throw new Error('Failed to fetch router names');
    }
    const data = await response.json();
    return data.routers;
  };