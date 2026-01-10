export interface GridLine {
    id: string;
    voltage: '500kV' | '275kV' | 'HVDC';
    path: [number, number][]; // [lat, lng] array
    interconnectionId?: string; // If this line represents an interconnection
}

export interface Interconnection {
    id: string;
    from: string;
    to: string;
    capacity: number; // MW
}

export const interconnections: Interconnection[] = [
    { id: 'kitahon', from: 'hokkaido', to: 'tohoku', capacity: 900 }, // DC
    { id: 'tohoku-tokyo', from: 'tohoku', to: 'tokyo', capacity: 5000 }, // AC (Multiple lines)
    { id: 'fc-tokyo-chubu', from: 'tokyo', to: 'chubu', capacity: 2100 }, // FC (Bidirectional, simplified as one)
    { id: 'fc-chubu-tokyo', from: 'chubu', to: 'tokyo', capacity: 2100 }, // Reverse
    { id: 'chubu-kansai', from: 'chubu', to: 'kansai', capacity: 2000 }, // AC
    { id: 'chubu-hokuriku', from: 'chubu', to: 'hokuriku', capacity: 1000 }, // AC (Simplified)
    { id: 'hokuriku-kansai', from: 'hokuriku', to: 'kansai', capacity: 1500 }, // AC
    { id: 'kansai-chugoku', from: 'kansai', to: 'chugoku', capacity: 3000 }, // AC
    { id: 'kansai-shikoku', from: 'kansai', to: 'shikoku', capacity: 1400 }, // DC/AC mix
    { id: 'chugoku-kyushu', from: 'chugoku', to: 'kyushu', capacity: 2500 }, // Kanmon
];

// Major Consumption Hubs (Approx coords)
const TOKYO = [35.6895, 139.6917] as [number, number];
const OSAKA = [34.6937, 135.5023] as [number, number];
const NAGOYA = [35.1815, 136.9066] as [number, number];
const FUKUOKA = [33.5902, 130.4017] as [number, number];
const SAPPORO = [43.0618, 141.3545] as [number, number];
const SENDAI_CITY = [38.2682, 140.8694] as [number, number];
const HIROSHIMA = [34.3853, 132.4553] as [number, number];
const KANAZAWA = [36.5613, 136.6562] as [number, number];
const TAKAMATSU = [34.3428, 134.0466] as [number, number];

// Plants (Copy coords from plants.ts for reference)
const TOMARI = [43.0416, 140.5097] as [number, number];
const HIGASHIDORI = [41.1872, 141.3853] as [number, number];
const ONAGAWA = [38.3997, 141.5036] as [number, number];
const TOKAI = [36.4674, 140.6042] as [number, number]; // Tokai Daini
const KASHIWAZAKI = [37.4290, 138.5606] as [number, number];
const SHIKA = [37.0601, 136.7214] as [number, number];
const HAMAOKA = [34.6213, 138.1362] as [number, number];
const WAKASA_BAY_CENTER = [35.6, 135.8] as [number, number]; // Cluster center for Mihama, Ohi, Takahama, Tsuruga
const SHIMANE = [35.5381, 133.0076] as [number, number];
const IKATA = [33.4907, 132.3117] as [number, number];
const GENKAI = [33.5133, 129.8390] as [number, number];
const SENDAI_PLANT = [31.8385, 130.1802] as [number, number];

export const gridLines: GridLine[] = [
    // Hokkaido
    { id: 'hokkaido-1', voltage: '275kV', path: [TOMARI, SAPPORO] },
    // Seikan Tunnel (DC Interconnection) - Ends near Aomori, not at plant directly
    { id: 'inter-hokkaido-tohoku', voltage: 'HVDC', path: [SAPPORO, [41.5, 140.5], [40.8, 140.5], SENDAI_CITY], interconnectionId: 'kitahon' },

    // Tohoku to Tokyo
    { id: 'inter-tohoku-tokyo', voltage: '500kV', path: [SENDAI_CITY, TOKYO], interconnectionId: 'tohoku-tokyo' },
    { id: 'onagawa-feeder', voltage: '500kV', path: [ONAGAWA, SENDAI_CITY] },
    // Higashidori / Ohma feeder to Sendai (separate from interconnection)
    { id: 'higashidori-feeder', voltage: '275kV', path: [HIGASHIDORI, [40.5, 141.0], SENDAI_CITY] },

    // TEPCO Region
    { id: 'tokai-feeder', voltage: '500kV', path: [TOKAI, TOKYO] },
    { id: 'kashiwazaki-feeder', voltage: '500kV', path: [KASHIWAZAKI, [36.5, 139.0], TOKYO] },

    // Chubu
    { id: 'hamaoka-feeder', voltage: '500kV', path: [HAMAOKA, NAGOYA] },
    { id: 'inter-tokyo-chubu', voltage: 'HVDC', path: [TOKYO, [35.0, 138.0], NAGOYA], interconnectionId: 'fc-tokyo-chubu' },

    // Hokuriku
    { id: 'shika-feeder', voltage: '500kV', path: [SHIKA, KANAZAWA] },
    { id: 'inter-hokuriku-chubu', voltage: '500kV', path: [KANAZAWA, [36.0, 137.0], NAGOYA], interconnectionId: 'chubu-hokuriku' },
    { id: 'inter-hokuriku-kansai', voltage: '500kV', path: [KANAZAWA, WAKASA_BAY_CENTER], interconnectionId: 'hokuriku-kansai' },

    // Kansai
    { id: 'wakasa-kansai', voltage: '500kV', path: [WAKASA_BAY_CENTER, OSAKA] },
    { id: 'wakasa-nagoya', voltage: '500kV', path: [WAKASA_BAY_CENTER, NAGOYA], interconnectionId: 'chubu-kansai' }, // Interconnection

    // Chugoku
    { id: 'shimane-feeder', voltage: '500kV', path: [SHIMANE, HIROSHIMA] },
    { id: 'inter-kansai-chugoku', voltage: '500kV', path: [OSAKA, HIROSHIMA], interconnectionId: 'kansai-chugoku' },

    // Shikoku
    { id: 'ikata-feeder', voltage: '500kV', path: [IKATA, TAKAMATSU] },
    { id: 'inter-kansai-shikoku', voltage: '500kV', path: [OSAKA, [34.5, 135.0], [34.0, 134.5], TAKAMATSU], interconnectionId: 'kansai-shikoku' },

    // Kyushu
    { id: 'genkai-feeder', voltage: '500kV', path: [GENKAI, FUKUOKA] },
    { id: 'sendai-feeder', voltage: '500kV', path: [SENDAI_PLANT, FUKUOKA] },
    { id: 'inter-chugoku-kyushu', voltage: '500kV', path: [HIROSHIMA, FUKUOKA], interconnectionId: 'chugoku-kyushu' },
];

export interface ConsumptionHub {
    id: string;
    name: string;
    lat: number;
    lng: number;
    baseDemand: number; // MW
    regionId: string;
}

export const consumptionHubs: ConsumptionHub[] = [
    // Based on 2023 actual peak demand data from each utility
    { id: 'tokyo', name: 'Tokyo', lat: 35.6895, lng: 139.6917, baseDemand: 55250, regionId: 'tokyo' }, // TEPCO 2023/7/18
    { id: 'osaka', name: 'Osaka', lat: 34.6937, lng: 135.5023, baseDemand: 29050, regionId: 'kansai' }, // KEPCO 2023 Summer
    { id: 'nagoya', name: 'Nagoya', lat: 35.1815, lng: 136.9066, baseDemand: 24650, regionId: 'chubu' }, // Chubu 2023/7/18
    { id: 'fukuoka', name: 'Fukuoka', lat: 33.5902, lng: 130.4017, baseDemand: 16460, regionId: 'kyushu' }, // Kyuden 2023 Summer
    { id: 'sapporo', name: 'Sapporo', lat: 43.0618, lng: 141.3545, baseDemand: 5691, regionId: 'hokkaido' }, // HEPCO 2023/1/25
    { id: 'sendai', name: 'Sendai', lat: 38.2682, lng: 140.8694, baseDemand: 14490, regionId: 'tohoku' }, // Tohoku 2023/8/23
    { id: 'hiroshima', name: 'Hiroshima', lat: 34.3853, lng: 132.4553, baseDemand: 10260, regionId: 'chugoku' }, // Chugoku 2023/7/27
    { id: 'kanazawa', name: 'Kanazawa', lat: 36.5613, lng: 136.6562, baseDemand: 4910, regionId: 'hokuriku' }, // Hokuriku 2023/7/28
    { id: 'takamatsu', name: 'Takamatsu', lat: 34.3428, lng: 134.0466, baseDemand: 4908, regionId: 'shikoku' }, // Yonden 2023/8/21
];
