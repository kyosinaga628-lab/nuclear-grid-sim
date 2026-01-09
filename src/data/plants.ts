export type PlantStatus = 'Active' | 'Suspended' | 'Under Review' | 'Construction' | 'Decommissioning';

export interface Plant {
  id: string;
  name: string;
  operator: string;
  lat: number;
  lng: number;
  capacity: number; // MW
  status: PlantStatus;
  regionId: string; // e.g., 'hokkaido', 'tohoku'
}

export const plants: Plant[] = [
  { id: 'tomari', name: '泊発電所', operator: 'HEPCO', lat: 43.0416, lng: 140.5097, capacity: 2070, status: 'Under Review', regionId: 'hokkaido' },
  { id: 'higashidori', name: '東通原子力発電所', operator: 'Tohoku', lat: 41.1872, lng: 141.3853, capacity: 1100, status: 'Under Review', regionId: 'tohoku' },
  { id: 'onagawa', name: '女川原子力発電所', operator: 'Tohoku', lat: 38.3997, lng: 141.5036, capacity: 1650, status: 'Active', regionId: 'tohoku' },
  { id: 'tokai-daini', name: '東海第二発電所', operator: 'JAPC', lat: 36.4674, lng: 140.6042, capacity: 1100, status: 'Under Review', regionId: 'tokyo' },
  { id: 'kashiwazaki-kariwa', name: '柏崎刈羽原子力発電所', operator: 'TEPCO', lat: 37.4290, lng: 138.5606, capacity: 8212, status: 'Under Review', regionId: 'tokyo' },
  { id: 'shika', name: '志賀原子力発電所', operator: 'Hokuriku', lat: 37.0601, lng: 136.7214, capacity: 1746, status: 'Under Review', regionId: 'hokuriku' },
  { id: 'hamaoka', name: '浜岡原子力発電所', operator: 'Chubu', lat: 34.6213, lng: 138.1362, capacity: 3617, status: 'Under Review', regionId: 'chubu' },
  { id: 'tsuruga', name: '敦賀発電所', operator: 'JAPC', lat: 35.6720, lng: 136.0744, capacity: 1160, status: 'Under Review', regionId: 'kansai' },
  { id: 'mihama', name: '美浜発電所', operator: 'KEPCO', lat: 35.7032, lng: 135.9599, capacity: 826, status: 'Active', regionId: 'kansai' },
  { id: 'ohi', name: '大飯発電所', operator: 'KEPCO', lat: 35.5398, lng: 135.6517, capacity: 2360, status: 'Active', regionId: 'kansai' },
  { id: 'takahama', name: '高浜発電所', operator: 'KEPCO', lat: 35.5222, lng: 135.5033, capacity: 3392, status: 'Active', regionId: 'kansai' },
  { id: 'shimane', name: '島根原子力発電所', operator: 'Chugoku', lat: 35.5381, lng: 133.0076, capacity: 820, status: 'Under Review', regionId: 'chugoku' },
  { id: 'ikata', name: '伊方発電所', operator: 'Yonden', lat: 33.4907, lng: 132.3117, capacity: 890, status: 'Active', regionId: 'shikoku' },
  { id: 'genkai', name: '玄海原子力発電所', operator: 'Kyuden', lat: 33.5133, lng: 129.8390, capacity: 2360, status: 'Active', regionId: 'kyushu' },
  { id: 'sendai', name: '川内原子力発電所', operator: 'Kyuden', lat: 31.8385, lng: 130.1802, capacity: 1780, status: 'Active', regionId: 'kyushu' },
  { id: 'ohma', name: '大間原子力発電所', operator: 'J-Power', lat: 41.5097, lng: 140.9092, capacity: 1383, status: 'Construction', regionId: 'tohoku' },
];
