export interface Project {
    id: string;
    name: string;
    maxTravelTime?: number;
    transportMode?: "walking" | "cycling" | "driving";
    locations: {
        id: string;
        name?: string;
        address: string;
        coordinates: [number, number];
        color: string;
    }[];
}

export const PRESETS: Project[] = [
    {
        "id": "nyc-tiffanys",
        "name": "New York - Breakfast at Tiffany's",
        "maxTravelTime": 10,
        "locations": [
            {
                "id": "nyc-tiffanys-1",
                "name": "Tiffany & Co.",
                "address": "727 5th Ave, New York, NY 10022, USA",
                "coordinates": [
                    -73.973928,
                    40.762657
                ],
                "color": "#ff00ff"
            },
            {
                "id": "nyc-tiffanys-2",
                "name": "Holly's Apartment",
                "address": "169 E 71st St, New York, NY 10021, USA",
                "coordinates": [
                    -73.961916,
                    40.769606
                ],
                "color": "#00ffff"
            },
            {
                "id": "nyc-tiffanys-3",
                "name": "NY Public Library",
                "address": "476 5th Ave, New York, NY 10018, USA",
                "coordinates": [
                    -73.982086,
                    40.753347
                ],
                "color": "#ffff00"
            },
            {
                "id": "nyc-tiffanys-4",
                "name": "Upper East Side",
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
        "name": "London - The Hound of the Baskervilles",
        "maxTravelTime": 15,
        "locations": [
            {
                "id": "london-sherlock-1",
                "name": "221B Baker Street",
                "address": "221B Baker St, London NW1 6XE, UK",
                "coordinates": [
                    -0.15856,
                    51.52375
                ],
                "color": "#ff00ff"
            },
            {
                "id": "london-sherlock-2",
                "name": "Lauriston Gardens",
                "address": "3 Lauriston Gardens, off Brixton Road, London, UK",
                "coordinates": [
                    -0.112607,
                    51.471356
                ],
                "color": "#00ffff"
            },
            {
                "id": "london-sherlock-3",
                "name": "Criterion Bar",
                "address": "224 Piccadilly, London W1J 9HP, UK",
                "coordinates": [
                    -0.13401,
                    51.50977
                ],
                "color": "#ffff00"
            },
            {
                "id": "london-sherlock-4",
                "name": "St. Bart's Hospital",
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
        "name": "Paris - Les Misérables",
        "maxTravelTime": 15,
        "locations": [
            {
                "id": "paris-lesmis-1",
                "name": "Salpêtrière Hospital",
                "address": "50-52 Boulevard de l'Hôpital, 75013 Paris, France",
                "coordinates": [
                    2.360062,
                    48.837586
                ],
                "color": "#ff00ff"
            },
            {
                "id": "paris-lesmis-2",
                "name": "Convent of Petit-Picpus",
                "address": "55 Rue Oudinot, 75007 Paris, France",
                "coordinates": [
                    2.315305,
                    48.849491
                ],
                "color": "#00ffff"
            },
            {
                "id": "paris-lesmis-3",
                "name": "Elephant of the Bastille",
                "address": "62 Rue de Picpus, 75012 Paris, France",
                "coordinates": [
                    2.397018,
                    48.843109
                ],
                "color": "#ffff00"
            },
            {
                "id": "paris-lesmis-4",
                "name": "Les Halles",
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
        "maxTravelTime": 10,
        "locations": [
            {
                "id": "moscow-master-1",
                "name": "House on Sadovaya",
                "address": "Bolshaya Sadovaya St 10, Moscow, Russia, 125047",
                "coordinates": [
                    37.617494,
                    55.750446
                ],
                "color": "#ff00ff"
            },
            {
                "id": "moscow-master-2",
                "name": "Patriarch's Ponds",
                "address": "Bol'shoy Patriarshiy Pereulok, 7, Moscow, Russia, 123001",
                "coordinates": [
                    37.592365,
                    55.762919
                ],
                "color": "#00ffff"
            },
            {
                "id": "moscow-master-3",
                "name": "House on Bersenevka",
                "address": "Bersenevskaya Naberezhnaya, 20/2, Moscow, Russia, 119072",
                "coordinates": [
                    37.6105,
                    55.7415
                ],
                "color": "#ffff00"
            },
            {
                "id": "moscow-master-4",
                "name": "Variety Theatre",
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
        "name": "Prague - The Unbearable Lightness of Being",
        "maxTravelTime": 15,
        "locations": [
            {
                "id": "prague-lightness-1",
                "name": "Old Town Square",
                "address": "Staroměstské nám., 110 00 Praha 1-Staré Město, Czechia",
                "coordinates": [
                    14.422954,
                    50.085837
                ],
                "color": "#ff00ff"
            },
            {
                "id": "prague-lightness-2",
                "name": "Charles Bridge",
                "address": "Karlův most, 110 00 Praha 1, Czechia",
                "coordinates": [
                    14.409804,
                    50.086667
                ],
                "color": "#00ffff"
            },
            {
                "id": "prague-lightness-3",
                "name": "Petřín Hill",
                "address": "Petřín, 169 00 Prague-Prague 6, Czechia",
                "coordinates": [
                    14.364195,
                    50.083831
                ],
                "color": "#ffff00"
            },
            {
                "id": "prague-lightness-4",
                "name": "National Theatre",
                "address": "Národní třída, 110 00 Praha 1, Czechia",
                "coordinates": [
                    14.418889,
                    50.081111
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "tokyo-murakami",
        "name": "Tokyo - 1Q84",
        "maxTravelTime": 20,
        "locations": [
            {
                "id": "tokyo-murakami-1",
                "name": "Gotenyama",
                "address": "1-18-31 Gotenyama, Musashino, Tokyo 180-0005, Japan",
                "coordinates": [
                    139.576623,
                    35.703123
                ],
                "color": "#ff00ff"
            },
            {
                "id": "tokyo-murakami-2",
                "name": "Shinjuku",
                "address": "3 Chome Shinjuku, Shinjuku City, Tokyo 160-0022, Japan",
                "coordinates": [
                    139.70348,
                    35.693142
                ],
                "color": "#00ffff"
            },
            {
                "id": "tokyo-murakami-3",
                "name": "Yoyogi Park",
                "address": "4 Chome Yoyogi, Shibuya City, Tokyo 151-0053, Japan",
                "coordinates": [
                    139.702042,
                    35.683458
                ],
                "color": "#ffff00"
            },
            {
                "id": "tokyo-murakami-4",
                "name": "Kichijōji",
                "address": "Kichijōji, Musashino, Tokyo 180-0004, Japan",
                "coordinates": [
                    139.56422,
                    35.712654
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "dublin-ulysses",
        "name": "Dublin - Ulysses",
        "maxTravelTime": 10,
        "locations": [
            {
                "id": "dublin-ulysses-1",
                "name": "7 Eccles Street",
                "address": "7 Eccles St, Dublin 7, Ireland",
                "coordinates": [
                    -6.265778,
                    53.356389
                ],
                "color": "#ff00ff"
            },
            {
                "id": "dublin-ulysses-2",
                "name": "Sweny's Pharmacy",
                "address": "Sweny's Pharmacy, 1 Lincoln Pl, Dublin 2, Ireland",
                "coordinates": [
                    -6.246944,
                    53.343333
                ],
                "color": "#00ffff"
            },
            {
                "id": "dublin-ulysses-3",
                "name": "Davy Byrne's Pub",
                "address": "Davy Byrne's, 21 Duke St, Dublin 2, Ireland",
                "coordinates": [
                    -6.257778,
                    53.342222
                ],
                "color": "#ffff00"
            },
            {
                "id": "dublin-ulysses-4",
                "name": "Sandymount Strand",
                "address": "Sandymount Strand, Dublin 4, Ireland",
                "coordinates": [
                    -6.208889,
                    53.329167
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "lisbon-disquiet",
        "name": "Lisbon - The Book of Disquiet",
        "maxTravelTime": 10,
        "locations": [
            {
                "id": "lisbon-disquiet-1",
                "name": "Rua dos Douradores",
                "address": "Rua dos Douradores, 1100-205 Lisboa, Portugal",
                "coordinates": [
                    -9.136111,
                    38.711944
                ],
                "color": "#ff00ff"
            },
            {
                "id": "lisbon-disquiet-2",
                "name": "Praça do Comércio",
                "address": "Praça do Comércio, 1100-148 Lisboa, Portugal",
                "coordinates": [
                    -9.136944,
                    38.707778
                ],
                "color": "#00ffff"
            },
            {
                "id": "lisbon-disquiet-3",
                "name": "Rossio Square",
                "address": "Rossio, 1100-200 Lisboa, Portugal",
                "coordinates": [
                    -9.139167,
                    38.713889
                ],
                "color": "#ffff00"
            },
            {
                "id": "lisbon-disquiet-4",
                "name": "Chiado",
                "address": "Chiado, 1200-109 Lisboa, Portugal",
                "coordinates": [
                    -9.142222,
                    38.710556
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "istanbul-red",
        "name": "Istanbul - My Name is Red",
        "maxTravelTime": 10,
        "locations": [
            {
                "id": "istanbul-red-1",
                "name": "Sultanahmet Square",
                "address": "Sultanahmet Meydanı, 34122 Fatih/İstanbul, Turkey",
                "coordinates": [
                    28.976389,
                    41.005833
                ],
                "color": "#ff00ff"
            },
            {
                "id": "istanbul-red-2",
                "name": "Grand Bazaar",
                "address": "Grand Bazaar, 34126 Fatih/İstanbul, Turkey",
                "coordinates": [
                    28.968056,
                    41.010833
                ],
                "color": "#00ffff"
            },
            {
                "id": "istanbul-red-3",
                "name": "Topkapı Palace",
                "address": "Topkapı Palace, 34122 Fatih/İstanbul, Turkey",
                "coordinates": [
                    28.983333,
                    41.011667
                ],
                "color": "#ffff00"
            },
            {
                "id": "istanbul-red-4",
                "name": "Galata Tower",
                "address": "Galata Tower, 34421 Beyoğlu/İstanbul, Turkey",
                "coordinates": [
                    28.974167,
                    41.025833
                ],
                "color": "#00ff00"
            }
        ]
    },
    {
        "id": "buenosaires-hopscotch",
        "name": "Buenos Aires - Hopscotch",
        "maxTravelTime": 25,
        "locations": [
            {
                "id": "buenosaires-hopscotch-1",
                "name": "Café Tortoni",
                "address": "Café Tortoni, Av. de Mayo 825, Buenos Aires, Argentina",
                "coordinates": [
                    -58.374167,
                    -34.608889
                ],
                "color": "#ff00ff"
            },
            {
                "id": "buenosaires-hopscotch-2",
                "name": "Plaza de Mayo",
                "address": "Plaza de Mayo, Buenos Aires, Argentina",
                "coordinates": [
                    -58.373056,
                    -34.608333
                ],
                "color": "#00ffff"
            },
            {
                "id": "buenosaires-hopscotch-3",
                "name": "San Telmo",
                "address": "San Telmo, Buenos Aires, Argentina",
                "coordinates": [
                    -58.372222,
                    -34.620556
                ],
                "color": "#ffff00"
            },
            {
                "id": "buenosaires-hopscotch-4",
                "name": "Recoleta Cemetery",
                "address": "Recoleta Cemetery, Buenos Aires, Argentina",
                "coordinates": [
                    -58.393333,
                    -34.587778
                ],
                "color": "#00ff00"
            }
        ]
    }
];
