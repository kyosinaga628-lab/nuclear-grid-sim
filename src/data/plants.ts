export type ReactorStatus = 'Active' | 'Suspended' | 'Under Review' | 'Construction';

export interface Reactor {
  id: string;
  unitNumber: number;
  capacity: number; // MW
  status: ReactorStatus;
}

export interface Plant {
  id: string;
  name: string;
  operator: string;
  lat: number;
  lng: number;
  regionId: string;
  reactors: Reactor[];
}

// Helper to create reactor IDs
const createReactor = (plantId: string, unit: number, capacity: number, status: ReactorStatus): Reactor => ({
  id: `${plantId}-${unit}`,
  unitNumber: unit,
  capacity,
  status,
});

export const plants: Plant[] = [
  // Hokkaido
  {
    id: 'tomari',
    name: '泊発電所',
    operator: 'HEPCO',
    lat: 43.0416,
    lng: 140.5097,
    regionId: 'hokkaido',
    reactors: [
      createReactor('tomari', 1, 579, 'Under Review'),
      createReactor('tomari', 2, 579, 'Under Review'),
      createReactor('tomari', 3, 912, 'Under Review'),
    ],
  },

  // Tohoku
  {
    id: 'higashidori',
    name: '東通原子力発電所',
    operator: 'Tohoku',
    lat: 41.1872,
    lng: 141.3853,
    regionId: 'tohoku',
    reactors: [
      createReactor('higashidori', 1, 1100, 'Under Review'),
    ],
  },
  {
    id: 'onagawa',
    name: '女川原子力発電所',
    operator: 'Tohoku',
    lat: 38.3997,
    lng: 141.5036,
    regionId: 'tohoku',
    reactors: [
      // 1号機は廃炉済みのため除外
      createReactor('onagawa', 2, 825, 'Active'),
      createReactor('onagawa', 3, 825, 'Under Review'),
    ],
  },
  {
    id: 'ohma',
    name: '大間原子力発電所',
    operator: 'J-Power',
    lat: 41.5097,
    lng: 140.9092,
    regionId: 'tohoku',
    reactors: [
      createReactor('ohma', 1, 1383, 'Construction'),
    ],
  },

  // Tokyo (TEPCO/JAPC)
  {
    id: 'tokai-daini',
    name: '東海第二発電所',
    operator: 'JAPC',
    lat: 36.4674,
    lng: 140.6042,
    regionId: 'tokyo',
    reactors: [
      createReactor('tokai-daini', 2, 1100, 'Under Review'),
    ],
  },
  {
    id: 'kashiwazaki-kariwa',
    name: '柏崎刈羽原子力発電所',
    operator: 'TEPCO',
    lat: 37.4290,
    lng: 138.5606,
    regionId: 'tokyo',
    reactors: [
      createReactor('kashiwazaki-kariwa', 1, 1100, 'Under Review'),
      createReactor('kashiwazaki-kariwa', 2, 1100, 'Under Review'),
      createReactor('kashiwazaki-kariwa', 3, 1100, 'Under Review'),
      createReactor('kashiwazaki-kariwa', 4, 1100, 'Under Review'),
      createReactor('kashiwazaki-kariwa', 5, 1100, 'Under Review'),
      createReactor('kashiwazaki-kariwa', 6, 1356, 'Under Review'),
      createReactor('kashiwazaki-kariwa', 7, 1356, 'Under Review'),
    ],
  },

  // Hokuriku
  {
    id: 'shika',
    name: '志賀原子力発電所',
    operator: 'Hokuriku',
    lat: 37.0601,
    lng: 136.7214,
    regionId: 'hokuriku',
    reactors: [
      createReactor('shika', 1, 540, 'Under Review'),
      createReactor('shika', 2, 1206, 'Under Review'),
    ],
  },

  // Chubu
  {
    id: 'hamaoka',
    name: '浜岡原子力発電所',
    operator: 'Chubu',
    lat: 34.6213,
    lng: 138.1362,
    regionId: 'chubu',
    reactors: [
      // 1-2号機は廃炉済み
      createReactor('hamaoka', 3, 1100, 'Under Review'),
      createReactor('hamaoka', 4, 1137, 'Under Review'),
      createReactor('hamaoka', 5, 1380, 'Under Review'),
    ],
  },

  // Kansai (KEPCO/JAPC)
  {
    id: 'tsuruga',
    name: '敦賀発電所',
    operator: 'JAPC',
    lat: 35.6720,
    lng: 136.0744,
    regionId: 'kansai',
    reactors: [
      // 1号機は廃炉済み
      createReactor('tsuruga', 2, 1160, 'Under Review'),
    ],
  },
  {
    id: 'mihama',
    name: '美浜発電所',
    operator: 'KEPCO',
    lat: 35.7032,
    lng: 135.9599,
    regionId: 'kansai',
    reactors: [
      // 1-2号機は廃炉済み
      createReactor('mihama', 3, 826, 'Active'),
    ],
  },
  {
    id: 'ohi',
    name: '大飯発電所',
    operator: 'KEPCO',
    lat: 35.5398,
    lng: 135.6517,
    regionId: 'kansai',
    reactors: [
      // 1-2号機は廃炉済み
      createReactor('ohi', 3, 1180, 'Active'),
      createReactor('ohi', 4, 1180, 'Active'),
    ],
  },
  {
    id: 'takahama',
    name: '高浜発電所',
    operator: 'KEPCO',
    lat: 35.5222,
    lng: 135.5033,
    regionId: 'kansai',
    reactors: [
      createReactor('takahama', 1, 826, 'Active'),
      createReactor('takahama', 2, 826, 'Active'),
      createReactor('takahama', 3, 870, 'Active'),
      createReactor('takahama', 4, 870, 'Active'),
    ],
  },

  // Chugoku
  {
    id: 'shimane',
    name: '島根原子力発電所',
    operator: 'Chugoku',
    lat: 35.5381,
    lng: 133.0076,
    regionId: 'chugoku',
    reactors: [
      // 1号機は廃炉済み
      createReactor('shimane', 2, 820, 'Under Review'),
      createReactor('shimane', 3, 1373, 'Construction'),
    ],
  },

  // Shikoku
  {
    id: 'ikata',
    name: '伊方発電所',
    operator: 'Yonden',
    lat: 33.4907,
    lng: 132.3117,
    regionId: 'shikoku',
    reactors: [
      // 1-2号機は廃炉済み
      createReactor('ikata', 3, 890, 'Active'),
    ],
  },

  // Kyushu
  {
    id: 'genkai',
    name: '玄海原子力発電所',
    operator: 'Kyuden',
    lat: 33.5133,
    lng: 129.8390,
    regionId: 'kyushu',
    reactors: [
      // 1-2号機は廃炉済み
      createReactor('genkai', 3, 1180, 'Active'),
      createReactor('genkai', 4, 1180, 'Active'),
    ],
  },
  {
    id: 'sendai',
    name: '川内原子力発電所',
    operator: 'Kyuden',
    lat: 31.8385,
    lng: 130.1802,
    regionId: 'kyushu',
    reactors: [
      createReactor('sendai', 1, 890, 'Active'),
      createReactor('sendai', 2, 890, 'Active'),
    ],
  },
];

// Helper functions
export const getPlantCapacity = (plant: Plant): number =>
  plant.reactors.reduce((sum, r) => sum + r.capacity, 0);

export const getPlantActiveCapacity = (plant: Plant): number =>
  plant.reactors
    .filter(r => r.status === 'Active')
    .reduce((sum, r) => sum + r.capacity, 0);

export const getPlantActiveCount = (plant: Plant): number =>
  plant.reactors.filter(r => r.status === 'Active').length;
