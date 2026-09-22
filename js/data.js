const EXPERIENCE_PRICES = {
  Standard: 190,
  GOLD: 300,
  "4DX": 260,
  MAX: 200,
  Kids: 180
};

const MOVIES = [
  {
    id: "spider-man-brand-new-day",
    title: "Spider-Man: Brand New Day",
    age: "12+",
    genre: "Action",
    runtime: 145,
    language: "English",
    subtitles: "Arabic",
    releaseDate: "30 July 2026",
    stars: "Tom Holland, Zendaya, Jacob Batalon, Sadie Sink",
    description: "Peter Parker fights crime full-time as Spider-Man in a world that no longer remembers him. Watching his old friends move on pushes him toward a change that may be the only way to stop a new threat to the city.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00013065_1782227665332.jpg",
    featured: true,
    showtimes: {
      GOLD: ["2:45 PM", "10:15 PM"],
      "4DX": ["2:15 PM"],
      Standard: ["1:15 PM", "4:30 PM", "7:45 PM", "11:00 PM"]
    }
  },
  {
    id: "the-odyssey",
    title: "The Odyssey",
    age: "16+",
    genre: "Adventure",
    runtime: 175,
    language: "English",
    subtitles: "Arabic",
    releaseDate: "16 July 2026",
    stars: "Matt Damon, Tom Holland, Anne Hathaway, Robert Pattinson, Zendaya",
    description: "A mythic action epic bringing Homer's foundational saga to the big screen, following an epic journey across a dangerous world of war, monsters and survival.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00013488_1783655908489.jpg",
    showtimes: {
      GOLD: ["6:15 PM"],
      "4DX": ["7:45 PM"],
      Standard: ["11:30 AM", "3:15 PM", "7:00 PM", "10:45 PM"]
    }
  },
  {
    id: "insidious-out-of-the-further",
    title: "Insidious: Out Of The Further",
    age: "16+",
    genre: "Horror",
    runtime: 105,
    language: "English",
    subtitles: "Arabic",
    releaseDate: "20 August 2026",
    stars: "Amelia Eve, Brandon Perea, Maisie Richardson-Sellers",
    description: "A young mother discovers she can enter The Further. When something evil follows her, she learns that her ability can bring what lives there back into the real world.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00013153_1786692785475.jpg",
    showtimes: {
      Standard: ["2:00 PM", "4:30 PM", "7:00 PM", "9:30 PM", "12:00 AM"]
    }
  },
  {
    id: "fall-2-deadpoint",
    title: "Fall 2: Deadpoint",
    age: "16+",
    genre: "Thriller",
    runtime: 100,
    language: "English",
    subtitles: "Arabic, English",
    releaseDate: "03 September 2026",
    stars: "Grace Caroline Currey, Virginia Gardner, Harriet Slater",
    description: "Jax and Luce attempt a dangerous plank walk high above Thailand. A rockslide leaves them trapped thousands of feet above the ground with no easy way down.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00013357_1786079719928.jpg",
    showtimes: {
      Standard: ["12:30 PM", "6:00 PM", "11:30 PM"]
    }
  },
  {
    id: "practical-magic-2",
    title: "Practical Magic 2",
    age: "16+",
    genre: "Sci-fi",
    runtime: 130,
    language: "English",
    subtitles: "Arabic",
    releaseDate: "10 September 2026",
    stars: "Nicole Kidman, Sandra Bullock, Joey King",
    description: "The Owens sisters return to a world of ancestral magic as the family confronts an old curse threatening the next generation.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00013352_1786338053973.jpg",
    showtimes: {
      Standard: ["12:15 PM", "3:00 PM", "8:30 PM"]
    }
  },
  {
    id: "el-gawahergy",
    title: "El Gawahergy",
    age: "G",
    genre: "Comedy",
    runtime: 110,
    language: "Arabic",
    subtitles: "—",
    releaseDate: "05 August 2026",
    stars: "Mohamed Henedy, Mona Zaki, Ahmed El Saadany, Lebleba",
    description: "A famous jeweler and his strong-willed wife try an unconventional relationship therapy programme, only for every step to trigger a new wave of comic chaos.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00012991_1785992257968.jpg",
    showtimes: {
      Standard: ["2:30 PM", "7:30 PM"]
    }
  },
  {
    id: "mutiny",
    title: "Mutiny",
    age: "16+",
    genre: "Action",
    runtime: 95,
    language: "English",
    subtitles: "Arabic",
    releaseDate: "20 August 2026",
    stars: "Jason Statham, Annabelle Wallis, Ramon Tikaram",
    description: "After his billionaire employer is murdered, Cole Reed is framed for the crime and forced on the run while uncovering an international conspiracy.",
    poster: "https://assets.voxcinemas.com/posters/P_HO00013088_1776406034678.jpg",
    showtimes: {
      Standard: ["12:00 AM"]
    }
  }
];

const CINEMA = {
  name: "Royal Mall",
  address: "Giza - Al Wahat Al Baharia, Level 2"
};

const OFFERS = [];
