export interface Project {
    id: string;
    name: string;
    maxTravelTime?: number;
    locations: {
        id: string;
        address: string;
        coordinates: [number, number];
        color: string;
    }[];
}

export const PRESETS: Project[] = [
    {
        "id": "nyc-tiffanys",
        "name": "New York - The Great Gatsby",
        "maxTravelTime": 30,
        "locations": [
            {
                "id": "nyc-tiffanys-1",
                "address": "727 5th Ave, New York, NY 10022, USA",
                "coordinates": [
                    -73.973928,
                    40.762657
                ],
                "color": "#ff00ff"
            },
            {
                "id": "nyc-tiffanys-2",
                "address": "169 E 71st St, New York, NY 10021, USA",
                "coordinates": [
                    -73.961916,
                    40.769606
                ],
                "color": "#00ffff"
            },
            {
                "id": "nyc-tiffanys-3",
                "address": "476 5th Ave, New York, NY 10018, USA",
                "coordinates": [
                    -73.982086,
                    40.753347
                ],
                "color": "#ffff00"
            },
            {
                "id": "nyc-tiffanys-4",
                "address": "New York, NY 10021, USA",
                "coordinates": [
                    -73.958384,
                    40.768812
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "london-sherlock",
        "name": "London - Sherlock Holmes",
        "maxTravelTime": 25,
        "locations": [
            {
                "id": "london-sherlock-1",
                "address": "221B Baker St, London NW1 6XE, UK",
                "coordinates": [
                    -0.15856,
                    51.52375
                ],
                "color": "#ff00ff"
            },
            {
                "id": "london-sherlock-2",
                "address": "3 Lauriston Gardens, off Brixton Road, London, UK",
                "coordinates": [
                    -0.112607,
                    51.471356
                ],
                "color": "#00ffff"
            },
            {
                "id": "london-sherlock-3",
                "address": "224 Piccadilly, London W1J 9HP, UK",
                "coordinates": [
                    -0.13401,
                    51.50977
                ],
                "color": "#ffff00"
            },
            {
                "id": "london-sherlock-4",
                "address": "W Smithfield, London EC1A 7BE, UK",
                "coordinates": [
                    -0.101685,
                    51.518308
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "paris-lesmis",
        "name": "Paris - The Da Vinci Code",
        "maxTravelTime": 20,
        "locations": [
            {
                "id": "paris-lesmis-1",
                "address": "50-52 Boulevard de l'Hôpital, 75013 Paris, France",
                "coordinates": [
                    2.360062,
                    48.837586
                ],
                "color": "#ff00ff"
            },
            {
                "id": "paris-lesmis-2",
                "address": "55 Rue Oudinot, 75007 Paris, France",
                "coordinates": [
                    2.315305,
                    48.849491
                ],
                "color": "#00ffff"
            },
            {
                "id": "paris-lesmis-3",
                "address": "62 Rue de Picpus, 75012 Paris, France",
                "coordinates": [
                    2.397018,
                    48.843109
                ],
                "color": "#ffff00"
            },
            {
                "id": "paris-lesmis-4",
                "address": "Rue Rambuteau, 75002 Paris, France",
                "coordinates": [
                    2.351165,
                    48.861763
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "moscow-master",
        "name": "Moscow - The Master and Margarita",
        "maxTravelTime": 35,
        "locations": [
            {
                "id": "moscow-master-1",
                "address": "Bolshaya Sadovaya St 10, Moscow, Russia, 125047",
                "coordinates": [
                    37.617494,
                    55.750446
                ],
                "color": "#ff00ff"
            },
            {
                "id": "moscow-master-2",
                "address": "Bol'shoy Patriarshiy Pereulok, 7, Moscow, Russia, 123001",
                "coordinates": [
                    37.592365,
                    55.762919
                ],
                "color": "#00ffff"
            },
            {
                "id": "moscow-master-3",
                "address": "Bersenevskaya Naberezhnaya, 20/2, Moscow, Russia, 119072",
                "coordinates": [
                    37.6105,
                    55.7415
                ],
                "color": "#ffff00"
            },
            {
                "id": "moscow-master-4",
                "address": "Tverskoy Blvd 25, Moscow, Russia, 125009",
                "coordinates": [
                    37.602164,
                    55.762557
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "prague-lightness",
        "name": "Prague - Unbearable Lightness",
        "maxTravelTime": 15,
        "locations": [
            {
                "id": "prague-lightness-1",
                "address": "Staroměstské nám., 110 00 Praha 1-Staré Město, Czechia",
                "coordinates": [
                    14.422954,
                    50.085837
                ],
                "color": "#ff00ff"
            },
            {
                "id": "prague-lightness-2",
                "address": "Karlův most, 110 00 Praha 1, Czechia",
                "coordinates": [
                    14.409804,
                    50.086667
                ],
                "color": "#00ffff"
            },
            {
                "id": "prague-lightness-3",
                "address": "Petřín, 169 00 Prague-Prague 6, Czechia",
                "coordinates": [
                    14.364195,
                    50.083831
                ],
                "color": "#ffff00"
            },
            {
                "id": "prague-lightness-4",
                "address": "Václavské nám., 110 00 Praha 1-Nové Město, Czechia",
                "coordinates": [
                    14.422954,
                    50.085837
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "tokyo-murakami",
        "name": "Tokyo - 1Q84",
        "maxTravelTime": 35,
        "locations": [
            {
                "id": "tokyo-murakami-1",
                "address": "1-18-31 Gotenyama, Musashino, Tokyo 180-0005, Japan",
                "coordinates": [
                    139.576623,
                    35.703123
                ],
                "color": "#ff00ff"
            },
            {
                "id": "tokyo-murakami-2",
                "address": "3 Chome Shinjuku, Shinjuku City, Tokyo 160-0022, Japan",
                "coordinates": [
                    139.70348,
                    35.693142
                ],
                "color": "#00ffff"
            },
            {
                "id": "tokyo-murakami-3",
                "address": "1-104 Totsukamachi, Shinjuku-ku, Tokyo 169-0071, Japan",
                "coordinates": [
                    139.70348,
                    35.693142
                ],
                "color": "#ffff00"
            },
            {
                "id": "tokyo-murakami-4",
                "address": "Kichijōji, Musashino, Tokyo 180-0004, Japan",
                "coordinates": [
                    139.56422,
                    35.712654
                ],
                "color": "#00ff00"
            }
        ]
    }
];
